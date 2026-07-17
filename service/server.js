import express from "express";
import { DefaultAzureCredential } from "@azure/identity";
import { AIProjectClient } from "@azure/ai-projects";

const endpoint = "https://masvezx.services.ai.azure.com/api/projects/praktikum";
const agentName = "masvezx";
const agentVersion = "12";
const port = process.env.PORT || 3000;

const projectClient = new AIProjectClient(endpoint, new DefaultAzureCredential());
const openAIClient = projectClient.getOpenAIClient();

const app = express();
app.use(express.json());

app.all("/chat", async (req, res) => {
  const { message, conversation } = { ...req.query, ...req.body };

  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  try {
    let conversationId = conversation;

    if (!conversationId) {
      // Start a new conversation with the user message
      const conv = await openAIClient.conversations.create({
        items: [{ type: "message", role: "user", content: message }],
      });
      conversationId = conv.id;
    }

    // Generate agent response (input adds the user message for existing conversations)
    const response = await openAIClient.responses.create(
      { conversation: conversationId, input: message },
      {
        body: {
          agent_reference: { name: agentName, version: agentVersion, type: "agent_reference" },
        },
      },
    );

    res.json({
      message: response.output_text,
      conversation: conversationId,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to process request" });
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
