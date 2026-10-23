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
  assert.equal(result.user.age, 28);
  assert.equal(result.recommendationSource, "rule_based");
});
