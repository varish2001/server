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

test("valid profile creation uses the existing plan and token response", async () => {
  const response = await fetch(`${baseUrl}/api/users/get-started`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Alex",
      age: 28,
      heightCm: 175,
      weightKg: 72,
      gender: "male",
      fitnessGoal: "muscle_gain",
      experienceLevel: "beginner"
    })
  });
  const result = await response.json();

  assert.equal(response.status, 201);
  assert.equal(typeof result.token, "string");
  assert.equal(result.user.name, "Alex");
  assert.equal(result.user.age, 28);
  assert.equal(result.recommendationSource, "rule_based");

  // Verify that submitting again with the token UPDATES the profile without creating duplicates
  const updateResponse = await fetch(`${baseUrl}/api/users/get-started`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${result.token}`
    },
    body: JSON.stringify({
      name: "Alex Updated",
      age: 29,
      heightCm: 175,
      weightKg: 74,
      gender: "male",
      fitnessGoal: "strength",
      experienceLevel: "intermediate"
    })
  });

  assert.equal(updateResponse.status, 200);
  const updateResult = await updateResponse.json();
  assert.equal(updateResult.user._id, result.user._id, "Should preserve the same user ID");
  assert.equal(updateResult.user.name, "Alex Updated");
  assert.equal(updateResult.user.age, 29);
  assert.equal(updateResult.updated, true);
});
