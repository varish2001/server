import OpenAI from "openai";

const client =
  process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your_openai_api_key"
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

export const getFitnessChatReply = async ({ question, profile }) => {
  if (!client) {
    return "AI provider is not configured. Add OPENAI_API_KEY in server/.env to enable chatbot responses.";
  }

  const systemPrompt =
    "You are a virtual gym trainer assistant. Answer only about fitness, posture, workouts, nutrition, hydration, and recovery. Keep replies concise and practical.";

  const profileContext = `User profile: age=${profile?.age}, heightCm=${profile?.heightCm}, weightKg=${profile?.weightKg}, gender=${profile?.gender}, goal=${profile?.fitnessGoal}, level=${profile?.experienceLevel}`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `${profileContext}\nQuestion: ${question}` }
    ]
  });

  return completion.choices?.[0]?.message?.content || "No response generated.";
};
