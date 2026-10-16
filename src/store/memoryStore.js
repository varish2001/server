const users = new Map();
const workouts = new Map();
const diets = new Map();
const logs = new Map();

const id = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export const memoryStore = {
  createUser(payload) {
    const user = {
      _id: id(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...payload
    };
    users.set(user._id, user);
    return user;
  },
  getUserById(userId) {
    return users.get(String(userId)) || null;
  },
  updateUser(userId, patch) {
    const prev = users.get(String(userId));
    if (!prev) return null;
    const next = { ...prev, ...patch, updatedAt: new Date() };
    users.set(String(userId), next);
    return next;
  },
  upsertWorkout(userId, payload) {
    const plan = { _id: id(), userId: String(userId), ...payload, updatedAt: new Date() };
    workouts.set(String(userId), plan);
    return plan;
  },
  getWorkout(userId) {
    return workouts.get(String(userId)) || null;
  },
  upsertDiet(userId, payload) {
    const plan = { _id: id(), userId: String(userId), ...payload, updatedAt: new Date() };
    diets.set(String(userId), plan);
    return plan;
  },
  getDiet(userId) {
    return diets.get(String(userId)) || null;
  },
  upsertLog(userId, date, patch) {
    const key = `${userId}:${date}`;
    const prev = logs.get(key) || { _id: id(), userId: String(userId), date, waterIntakeMl: 0, caloriesBurned: 0, workoutsCompleted: 0 };
    const next = { ...prev, ...patch, updatedAt: new Date() };
    logs.set(key, next);
    return next;
  },
  addWater(userId, date, amountMl) {
    const key = `${userId}:${date}`;
    const prev = logs.get(key) || { _id: id(), userId: String(userId), date, waterIntakeMl: 0, caloriesBurned: 0, workoutsCompleted: 0 };
    const next = { ...prev, waterIntakeMl: (prev.waterIntakeMl || 0) + amountMl, updatedAt: new Date() };
    logs.set(key, next);
    return next;
  },
  getLogs(userId) {
    return Array.from(logs.values())
      .filter((x) => x.userId === String(userId))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-90);
  }
};
