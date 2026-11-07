import assert from "node:assert/strict";
import test, { after, before } from "node:test";

process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-testing";
process.env.OPENAI_API_KEY = "your_openai_api_key";

const { app } = await import("../src/app.js");
let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("root and health endpoints respond with success", async () => {
  const rootResponse = await fetch(`${baseUrl}/`);
  assert.equal(rootResponse.status, 200);
  const rootData = await rootResponse.json();
  assert.equal(rootData.status, "ok");

  const healthResponse = await fetch(`${baseUrl}/health`);
  assert.equal(healthResponse.status, 200);
  assert.deepEqual(await healthResponse.json(), { ok: true });

  const apiHealthResponse = await fetch(`${baseUrl}/api/health`);
  assert.equal(apiHealthResponse.status, 200);
  assert.deepEqual(await apiHealthResponse.json(), { ok: true });
});

test("auth flow: register -> duplicate reject -> login -> me", async () => {
  const email = `test.${Date.now()}@example.com`;
  const password = "password123";

  // 1. Register new user
  const regResponse = await fetch(`${baseUrl}/api/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Auth Tester", email, password })
  });
  assert.equal(regResponse.status, 201);
  const regData = await regResponse.json();
  assert.ok(regData.token, "Registration should return a token");
  assert.equal(regData.user.email, email);
  assert.equal(regData.user.name, "Auth Tester");
  assert.equal(regData.user.password, undefined, "Password hash must not be exposed");

  // 2. Duplicate registration should be rejected with 409
  const dupResponse = await fetch(`${baseUrl}/api/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Clone", email, password })
  });
  assert.equal(dupResponse.status, 409);

  // 3. Login with correct credentials
  const loginResponse = await fetch(`${baseUrl}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  assert.equal(loginResponse.status, 200);
  const loginData = await loginResponse.json();
  assert.ok(loginData.token, "Login should return a token");
  assert.equal(loginData.user.email, email);

  // 4. Login with incorrect password
  const badLoginResponse = await fetch(`${baseUrl}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "wrong_password" })
  });
  assert.equal(badLoginResponse.status, 401);

  // 5. Connect fitness profile to authenticated user via /get-started
  const profileResponse = await fetch(`${baseUrl}/api/users/get-started`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${loginData.token}`
    },
    body: JSON.stringify({
      name: "Auth Tester",
      age: 26,
      heightCm: 180,
      weightKg: 78,
      gender: "male",
      fitnessGoal: "muscle_gain",
      experienceLevel: "intermediate"
    })
  });
  assert.equal(profileResponse.status, 200);
  const profileData = await profileResponse.json();
  assert.equal(profileData.user._id, loginData.user._id, "Profile must attach to the authenticated user ID");
  assert.equal(profileData.user.hasProfile, true);
  assert.equal(profileData.user.age, 26);
  assert.equal(profileData.updated, true);

  // 6. Fetch /me to verify profile fields are persisted with the user
  const meResponse = await fetch(`${baseUrl}/api/users/me`, {
    headers: { Authorization: `Bearer ${loginData.token}` }
  });
  assert.equal(meResponse.status, 200);
  const meData = await meResponse.json();
  assert.equal(meData._id, loginData.user._id);
  assert.equal(meData.age, 26);
  assert.equal(meData.fitnessGoal, "muscle_gain");
});

test("production origin can preflight profile creation", async () => {
  const response = await fetch(`${baseUrl}/api/users/get-started`, {
    method: "OPTIONS",
    headers: {
      Origin: "https://client0-seven.vercel.app",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type,authorization"
    }
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://client0-seven.vercel.app");
  assert.equal(response.headers.get("access-control-allow-credentials"), "true");
  assert.match(response.headers.get("access-control-allow-methods"), /POST/);
  assert.match(response.headers.get("access-control-allow-headers"), /Content-Type/i);
  assert.match(response.headers.get("access-control-allow-headers"), /Authorization/i);
});

test("unapproved origins are denied", async () => {
  const response = await fetch(`${baseUrl}/api/users/get-started`, {
    method: "OPTIONS",
    headers: {
      Origin: "https://untrusted.example",
      "Access-Control-Request-Method": "POST"
    }
  });

  assert.equal(response.status, 403);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
  assert.deepEqual(await response.json(), { message: "Origin is not allowed" });
});

test("profile endpoint is mounted once and validates profile data", async () => {
  const invalidResponse = await fetch(`${baseUrl}/api/users/get-started`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });

  assert.equal(invalidResponse.status, 400);
  assert.deepEqual((await invalidResponse.json()).message, "Invalid profile data");

  const duplicatePrefixResponse = await fetch(`${baseUrl}/api/users/api/get-started`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  assert.equal(duplicatePrefixResponse.status, 404);
});
