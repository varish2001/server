const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const GOAL_LABELS = {
  muscle_gain: "Muscle Gain",
  fat_loss: "Fat Loss",
  strength: "Strength",
  endurance: "Endurance",
  beginner_fitness: "Beginner Fitness",
  maintenance: "General Fitness"
};

const DEFAULT_DAYS_BY_LEVEL = {
  beginner: 3,
  intermediate: 4,
  advanced: 5
};

const GOAL_SPLITS = {
  muscle_gain: {
    3: ["Push", "Pull", "Legs"],
    4: ["Upper Hypertrophy", "Lower Hypertrophy", "Push", "Pull + Legs"],
    5: ["Push", "Pull", "Legs", "Upper Accessories", "Lower + Core"],
    6: ["Push", "Pull", "Legs", "Push Volume", "Pull Volume", "Legs Volume"]
  },
  fat_loss: {
    3: ["Full Body Strength", "Metabolic Circuit", "Strength + Intervals"],
    4: ["Upper Strength", "Lower Strength", "Conditioning Circuit", "Full Body Burn"],
    5: ["Full Body Strength", "Cardio Conditioning", "Lower Body Burn", "Upper Body Circuit", "Intervals + Core"],
    6: ["Full Body Strength", "Zone 2 Cardio", "Lower Circuit", "Upper Circuit", "Intervals", "Mobility + Core"]
  },
  strength: {
    3: ["Squat Focus", "Bench Focus", "Deadlift Focus"],
    4: ["Squat Focus", "Bench Focus", "Deadlift Focus", "Overhead Press Focus"],
    5: ["Squat Heavy", "Bench Heavy", "Deadlift Heavy", "Upper Assistance", "Lower Assistance"],
    6: ["Squat Heavy", "Bench Heavy", "Deadlift Heavy", "Press Volume", "Pull Assistance", "Lower Assistance"]
  },
  endurance: {
    3: ["Full Body Endurance", "Conditioning", "Functional Strength"],
    4: ["Upper Endurance", "Lower Endurance", "Conditioning", "Core + Mobility"],
    5: ["Functional Strength", "Tempo Conditioning", "Lower Endurance", "Upper Endurance", "Long Conditioning"],
    6: ["Functional Strength", "Zone 2 Cardio", "Lower Endurance", "Upper Endurance", "Intervals", "Mobility + Core"]
  },
  beginner_fitness: {
    3: ["Full Body A", "Full Body B", "Full Body C"],
    4: ["Full Body A", "Mobility + Core", "Full Body B", "Conditioning Basics"],
    5: ["Full Body A", "Walk + Mobility", "Full Body B", "Core Basics", "Full Body C"],
    6: ["Full Body A", "Walk + Mobility", "Full Body B", "Core Basics", "Full Body C", "Stretch + Recovery"]
  },
  maintenance: {
    3: ["Full Body Strength", "Conditioning", "Full Body Volume"],
    4: ["Upper Body", "Lower Body", "Conditioning", "Full Body"],
    5: ["Push", "Pull", "Legs", "Conditioning", "Core + Mobility"],
    6: ["Push", "Pull", "Legs", "Conditioning", "Upper Volume", "Lower Volume"]
  }
};

const EXERCISE_BANK = {
  gym: {
    Push: [
      ex("Bench Press", "Chest", "intermediate", "Control the eccentric and keep shoulder blades pinned."),
      ex("Incline Dumbbell Press", "Upper Chest", "intermediate", "Use a slight arch and stop short of shoulder strain."),
      ex("Seated Dumbbell Shoulder Press", "Shoulders", "intermediate", "Brace your core before every rep."),
      ex("Cable Triceps Pushdown", "Triceps", "beginner", "Keep elbows fixed and finish with a full lockout."),
      ex("Lateral Raise", "Side Delts", "beginner", "Lead with elbows and avoid swinging.")
    ],
    Pull: [
      ex("Lat Pulldown", "Lats", "beginner", "Pull elbows toward ribs, not behind your body."),
      ex("Seated Cable Row", "Mid Back", "beginner", "Pause with shoulder blades squeezed."),
      ex("Chest-Supported Dumbbell Row", "Upper Back", "intermediate", "Keep the torso still through the set."),
      ex("Face Pull", "Rear Delts", "beginner", "Pull toward eye level and rotate thumbs back."),
      ex("EZ-Bar Curl", "Biceps", "beginner", "Keep wrists neutral and elbows under shoulders.")
    ],
    Legs: [
      ex("Back Squat", "Quads", "intermediate", "Brace hard and keep knees tracking over toes."),
      ex("Romanian Deadlift", "Hamstrings", "intermediate", "Hinge from hips and keep the bar close."),
      ex("Leg Press", "Quads", "beginner", "Use full control and avoid locking knees aggressively."),
      ex("Walking Lunge", "Glutes", "intermediate", "Take long stable steps and stay tall."),
      ex("Standing Calf Raise", "Calves", "beginner", "Pause at the top and stretch at the bottom.")
    ],
    "Full Body": [
      ex("Goblet Squat", "Quads", "beginner", "Keep chest tall and move through a comfortable range."),
      ex("Dumbbell Bench Press", "Chest", "beginner", "Lower under control and press evenly."),
      ex("Lat Pulldown", "Lats", "beginner", "Drive elbows down and keep ribs stacked."),
      ex("Dumbbell Romanian Deadlift", "Hamstrings", "beginner", "Soft knees, hips back, neutral spine."),
      ex("Plank", "Core", "beginner", "Squeeze glutes and keep ribs down.")
    ],
    Conditioning: [
      ex("Treadmill Incline Walk", "Cardio", "beginner", "Stay nasal-breathing if possible."),
      ex("Kettlebell Swing", "Posterior Chain", "intermediate", "Snap hips through; do not squat the swing."),
      ex("Battle Rope Waves", "Shoulders", "intermediate", "Stay low and keep waves consistent."),
      ex("Sled Push", "Legs", "intermediate", "Drive through the floor with short powerful steps."),
      ex("Cable Woodchop", "Core", "beginner", "Rotate through the torso, not the lower back.")
    ],
    Strength: [
      ex("Back Squat", "Quads", "advanced", "Use warm-up sets and stop two reps before form breaks."),
      ex("Bench Press", "Chest", "advanced", "Keep your bar path consistent and brace before unracking."),
      ex("Deadlift", "Posterior Chain", "advanced", "Set lats, push the floor away, and keep the bar close."),
      ex("Overhead Press", "Shoulders", "intermediate", "Squeeze glutes and press in a straight line."),
      ex("Barbell Row", "Back", "intermediate", "Hold torso angle and row toward lower ribs.")
    ]
  },
  home: {
    Push: [
      ex("Push-Up", "Chest", "beginner", "Keep a straight line from shoulders to heels."),
      ex("Pike Push-Up", "Shoulders", "intermediate", "Move head forward between hands under control."),
      ex("Chair Triceps Dip", "Triceps", "beginner", "Keep shoulders down and elbows close."),
      ex("Backpack Floor Press", "Chest", "beginner", "Pause lightly on the floor before pressing."),
      ex("Slow Tempo Push-Up", "Chest", "intermediate", "Use a three-second lowering phase.")
    ],
    Pull: [
      ex("Towel Row", "Back", "beginner", "Pull elbows back and squeeze shoulder blades."),
      ex("Backpack Row", "Lats", "beginner", "Hinge at hips and keep neck neutral."),
      ex("Prone Y-T-W Raise", "Rear Delts", "beginner", "Move slowly and avoid shrugging."),
      ex("Doorway Isometric Row", "Back", "beginner", "Pull steadily for each timed hold."),
      ex("Backpack Curl", "Biceps", "beginner", "Control both up and down phases.")
    ],
    Legs: [
      ex("Bodyweight Squat", "Quads", "beginner", "Sit between hips and keep feet grounded."),
      ex("Reverse Lunge", "Glutes", "beginner", "Step back softly and drive through the front foot."),
      ex("Single-Leg Romanian Deadlift", "Hamstrings", "intermediate", "Reach long and keep hips square."),
      ex("Glute Bridge", "Glutes", "beginner", "Pause at the top without arching your back."),
      ex("Calf Raise", "Calves", "beginner", "Use a full stretch and strong top squeeze.")
    ],
    "Full Body": [
      ex("Bodyweight Squat", "Quads", "beginner", "Own the bottom position before standing."),
      ex("Incline Push-Up", "Chest", "beginner", "Use a bench or table height you can control."),
      ex("Backpack Row", "Back", "beginner", "Pull with elbows and avoid rounding."),
      ex("Glute Bridge", "Glutes", "beginner", "Drive through heels and pause at the top."),
      ex("Dead Bug", "Core", "beginner", "Move slowly while your lower back stays down.")
    ],
    Conditioning: [
      ex("Marching High Knees", "Cardio", "beginner", "Move rhythmically and keep posture tall."),
      ex("Mountain Climber", "Core", "intermediate", "Keep shoulders over wrists and hips level."),
      ex("Squat to Reach", "Legs", "beginner", "Stand tall and reach overhead each rep."),
      ex("Step-Up", "Glutes", "beginner", "Use a stable step and control the descent."),
      ex("Shadow Boxing", "Cardio", "beginner", "Stay light on the feet and breathe steadily.")
    ],
    Strength: [
      ex("Tempo Split Squat", "Quads", "intermediate", "Lower for three seconds and drive up."),
      ex("Weighted Push-Up", "Chest", "intermediate", "Use a backpack only if form is solid."),
      ex("Backpack Romanian Deadlift", "Hamstrings", "beginner", "Hinge cleanly and keep load close."),
      ex("Pike Push-Up", "Shoulders", "intermediate", "Keep elbows at a strong angle."),
      ex("Side Plank", "Core", "beginner", "Stack hips and keep a long spine.")
    ]
  }
};

function ex(name, muscleTargeted, difficulty, tips) {
  return { name, muscleTargeted, difficulty, tips };
}

const normalizeGoal = (value) => {
  if (value === "beginner") return "beginner_fitness";
  return ["muscle_gain", "fat_loss", "strength", "endurance", "beginner_fitness", "maintenance"].includes(value)
    ? value
    : "maintenance";
};

const normalizeLevel = (value) =>
  ["beginner", "intermediate", "advanced"].includes(value) ? value : "beginner";

const normalizeEquipment = (value) => (value === "home" ? "home" : "gym");

const normalizeDays = (value, level) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) return Math.min(6, Math.max(3, Math.round(parsed)));
  return DEFAULT_DAYS_BY_LEVEL[level] || 3;
};

export const normalizeWorkoutProfile = (input = {}) => {
  const level = normalizeLevel(input.experienceLevel);
  const goal = normalizeGoal(input.goal || input.fitnessGoal);
  return {
    age: Number(input.age) || 25,
    heightCm: Number(input.heightCm) || 170,
    weightKg: Number(input.weightKg) || 70,
    gender: ["male", "female", "other"].includes(input.gender) ? input.gender : "other",
    fitnessGoal: goal,
    goal,
    goalLabel: GOAL_LABELS[goal] || GOAL_LABELS.maintenance,
    experienceLevel: level,
    workoutDaysPerWeek: normalizeDays(input.workoutDaysPerWeek, level),
    equipmentPreference: normalizeEquipment(input.equipmentPreference),
    injuriesLimitations: String(input.injuriesLimitations || "").trim()
  };
};

const getVolume = (goal, level) => {
  if (goal === "strength") {
    return {
      sets: level === "advanced" ? 5 : level === "intermediate" ? 4 : 3,
      reps: level === "beginner" ? "5-8" : "3-6",
      rest: level === "beginner" ? "120 sec" : "2-3 min"
    };
  }

  if (goal === "endurance") {
    return {
      sets: level === "advanced" ? 4 : 3,
      reps: "15-20",
      rest: "30-45 sec"
    };
  }

  if (goal === "fat_loss") {
    return {
      sets: level === "advanced" ? 4 : 3,
      reps: "12-15",
      rest: "45-60 sec"
    };
  }

  if (goal === "beginner_fitness") {
    return {
      sets: 2,
      reps: "10-12",
      rest: "90 sec"
    };
  }

  return {
    sets: level === "advanced" ? 5 : level === "intermediate" ? 4 : 3,
    reps: "8-12",
    rest: "60-90 sec"
  };
};

const focusToBankKey = (focus, goal) => {
  if (focus.includes("Bench") || focus.includes("Press")) return "Push";
  if (focus.includes("Squat") || focus.includes("Deadlift") || focus.includes("Lower") || focus.includes("Leg")) return "Legs";
  if (goal === "strength" || focus.includes("Heavy") || focus.includes("Focus")) return "Strength";
  if (focus.includes("Circuit") || focus.includes("Conditioning") || focus.includes("Intervals") || focus.includes("Cardio")) {
    return "Conditioning";
  }
  if (focus.includes("Push")) return "Push";
  if (focus.includes("Upper")) return "Upper";
  if (focus.includes("Pull")) return "Pull";
  return "Full Body";
};

const selectExercisePool = (bank, bankKey) => {
  if (bankKey === "Upper") return [...bank.Push, ...bank.Pull];
  return bank[bankKey] || bank["Full Body"];
};

const exerciseCount = (level, goal) => {
  if (level === "beginner" || goal === "beginner_fitness") return 4;
  if (level === "advanced") return 6;
  return 5;
};

const buildExercise = (base, volume, goal, level, index) => {
  const advancedTip =
    level === "advanced" && index >= 3
      ? " Add a controlled intensity technique on the final set only if form remains sharp."
      : "";
  const circuitTip = goal === "fat_loss" || goal === "endurance" ? " Keep transitions crisp and breathing controlled." : "";

  return {
    name: base.name,
    sets: volume.sets,
    reps: volume.reps,
    rest: volume.rest,
    muscleTargeted: base.muscleTargeted,
    difficulty: level === "advanced" && base.difficulty !== "beginner" ? "advanced" : base.difficulty,
    tips: `${base.tips}${advancedTip}${circuitTip}`.trim()
  };
};

const getSplitName = (goal, days) => {
  if (goal === "muscle_gain" && days >= 5) return "Push Pull Legs Hypertrophy";
  if (goal === "muscle_gain") return "Hypertrophy Split";
  if (goal === "fat_loss") return "Strength + Conditioning";
  if (goal === "strength") return "Compound Strength Split";
  if (goal === "endurance") return "Functional Endurance";
  if (goal === "beginner_fitness") return "Beginner Full Body";
  return "Balanced Fitness Split";
};

const getRestDays = (daysPerWeek) => DAYS.slice(daysPerWeek);

const getProgressiveOverload = (goal, level) => {
  if (goal === "strength") {
    return "When all working sets move cleanly, add 2.5-5 kg next week. Keep one to two reps in reserve on main lifts.";
  }
  if (goal === "fat_loss") {
    return "Keep strength loads stable while reducing rest slightly or adding one conditioning round every two weeks.";
  }
  if (goal === "endurance") {
    return "Add reps or time before adding load. Progress by increasing total work while keeping breathing controlled.";
  }
  if (goal === "beginner_fitness" || level === "beginner") {
    return "Master technique first. Add one set or a small load increase only after every rep looks consistent.";
  }
  return "Use progressive overload by adding 1-2 reps per set before increasing load. Deload every fourth to sixth week if fatigue builds.";
};

const getWarmUp = (goal) => {
  if (goal === "strength") return "8-10 minutes light cardio, dynamic hips/shoulders, then three ramp-up sets for the main lift.";
  if (goal === "fat_loss") return "5 minutes brisk cardio, dynamic mobility, then one easy circuit round before working sets.";
  if (goal === "endurance") return "5-8 minutes easy movement, ankle/hip/shoulder mobility, and gradual tempo build-up.";
  return "5-8 minutes light cardio plus dynamic mobility for hips, shoulders, and thoracic spine.";
};

const getCoolDown = (goal) => {
  if (goal === "endurance") return "Walk for 5 minutes, then stretch calves, hip flexors, hamstrings, chest, and lats.";
  return "Cool down with 5 minutes easy walking and stretch the primary muscles trained for 30-45 seconds each.";
};

const recoveryTips = (profile) => {
  const tips = [
    "Sleep 7-9 hours and keep protein intake consistent with your diet plan.",
    "Stop any exercise that aggravates pain and use a pain-free range of motion.",
    "Keep at least one full recovery day after the hardest lower-body or strength session."
  ];

  if (profile.injuriesLimitations) {
    tips.unshift(`Limitation noted: ${profile.injuriesLimitations}. Choose the listed movement only if it is pain-free.`);
  }

  return tips;
};

export const buildWorkoutPlan = (input = {}) => {
  const profile = normalizeWorkoutProfile(input);
  const splitTemplate = GOAL_SPLITS[profile.goal]?.[profile.workoutDaysPerWeek] || GOAL_SPLITS.maintenance[profile.workoutDaysPerWeek];
  const bank = EXERCISE_BANK[profile.equipmentPreference];
  const volume = getVolume(profile.goal, profile.experienceLevel);
  const count = exerciseCount(profile.experienceLevel, profile.goal);

  const weeklyPlan = splitTemplate.map((focus, index) => {
    const bankKey = focusToBankKey(focus, profile.goal);
    const pool = selectExercisePool(bank, bankKey);
    const exercises = Array.from({ length: count }, (_, exerciseIndex) => {
      const base = pool[(index + exerciseIndex) % pool.length];
      return buildExercise(base, volume, profile.goal, profile.experienceLevel, exerciseIndex);
    });

    return {
      day: DAYS[index],
      focus,
      exercises
    };
  });

  return {
    goal: profile.goalLabel,
    goalKey: profile.goal,
    split: getSplitName(profile.goal, profile.workoutDaysPerWeek),
    workoutDaysPerWeek: profile.workoutDaysPerWeek,
    equipmentPreference: profile.equipmentPreference,
    experienceLevel: profile.experienceLevel,
    weeklyPlan,
    warmUp: getWarmUp(profile.goal),
    coolDown: getCoolDown(profile.goal),
    progressiveOverload: getProgressiveOverload(profile.goal, profile.experienceLevel),
    restDays: getRestDays(profile.workoutDaysPerWeek),
    recoveryTips: recoveryTips(profile),
    generatedAt: new Date()
  };
};
