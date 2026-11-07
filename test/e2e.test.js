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
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("full user lifecycle: get-started -> me -> plans -> tracking", async () => {
  // 1. Submit Onboarding Form (same as OnboardingPage.jsx)
  const getStartedResponse = await fetch(`${baseUrl}/users/get-started`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://client0-seven.vercel.app"
    },
    body: JSON.stringify({
      name: "Test Athlete",
      age: 24,
      heightCm: 178,
      weightKg: 75,
      gender: "male",
      fitnessGoal: "muscle_gain",
      experienceLevel: "beginner",
      activityLevel: "moderate",
      dietPreference: "veg",
      workoutDaysPerWeek: 4,
      equipmentPreference: "gym",
      injuriesLimitations: ""
    })
  });

  assert.equal(getStartedResponse.status, 201);
  assert.equal(getStartedResponse.headers.get("access-control-allow-origin"), "https://client0-seven.vercel.app");

  const signupData = await getStartedResponse.json();
  assert.ok(signupData.token, "Token should be present");
  assert.equal(signupData.user.name, "Test Athlete");
  assert.equal(signupData.user.fitnessGoal, "muscle_gain");
  assert.equal(signupData.user.workoutDaysPerWeek, 4);

  const token = signupData.token;
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Origin: "https://client0-seven.vercel.app"
  };

  // 2. Fetch authenticated profile /users/me
  const meResponse = await fetch(`${baseUrl}/users/me`, { headers: authHeaders });
  assert.equal(meResponse.status, 200);
  const meData = await meResponse.json();
  assert.equal(meData.name, "Test Athlete");

  // 3. Fetch workout plan /plans/workout
  const workoutResponse = await fetch(`${baseUrl}/plans/workout`, { headers: authHeaders });
  assert.equal(workoutResponse.status, 200);
  const workoutData = await workoutResponse.json();
  assert.ok(Array.isArray(workoutData.weeklyPlan), "Weekly plan should be an array");
  assert.equal(workoutData.weeklyPlan.length, 4);

  // 4. Fetch diet plan /plans/diet
  const dietResponse = await fetch(`${baseUrl}/plans/diet`, { headers: authHeaders });
  assert.equal(dietResponse.status, 200);
  const dietData = await dietResponse.json();
  assert.ok(dietData.calories > 0, "Calories target should be positive");
  assert.ok(dietData.hydration > 0, "Hydration target should be positive");
  assert.ok(dietData.meals?.breakfast, "Meals breakfast should be present");

  // 5. Log hydration /tracking/water
  const waterResponse = await fetch(`${baseUrl}/tracking/water`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ amountMl: 500 })
  });
  assert.equal(waterResponse.status, 200);
  const waterData = await waterResponse.json();
  assert.equal(waterData.waterIntakeMl, 500);

  // 6. Log progress /tracking/today
  const todayResponse = await fetch(`${baseUrl}/tracking/today`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      waterIntakeMl: 500,
      caloriesBurned: 350,
      workoutsCompleted: 1,
      weightKg: 74.8
    })
  });
  assert.equal(todayResponse.status, 200);

  // 7. Get logs /tracking/logs
  const logsResponse = await fetch(`${baseUrl}/tracking/logs`, { headers: authHeaders });
  assert.equal(logsResponse.status, 200);
  const logsData = await logsResponse.json();
  assert.ok(Array.isArray(logsData), "Logs should be an array");
  assert.equal(logsData.length, 1);
  assert.equal(logsData[0].caloriesBurned, 350);
});
