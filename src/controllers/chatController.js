import { getFitnessChatReply } from "../services/chatbotService.js";

export const chat = async (req, res) => {
  try {
    const { message } = req.body;
    const reply = await getFitnessChatReply({ question: message, profile: req.user });
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
