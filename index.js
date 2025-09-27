import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// Configuração
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const DIALOGFLOW_TOKEN = process.env.DIALOGFLOW_TOKEN;
const PROJECT_ID = process.env.PROJECT_ID; 


app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// Receber mensagens do Instagram
app.post("/webhook", async (req, res) => {
  const entry = req.body.entry?.[0];
  const messaging = entry?.messaging?.[0];
  const senderId = messaging?.sender?.id;
  const message = messaging?.message?.text;

  if (senderId && message) {
    const dfResponse = await callDialogflow(message, senderId);
    await sendMessage(senderId, dfResponse);
  }

  res.sendStatus(200);
});

// Chama Dialogflow ES
async function callDialogflow(text, sessionId) {
  const url = `https://dialogflow.googleapis.com/v2/projects/${PROJECT_ID}/agent/sessions/${sessionId}:detectIntent`;
  const body = {
    queryInput: {
      text: { text, languageCode: "pt-BR" },
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DIALOGFLOW_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return data.queryResult.fulfillmentText || "Não entendi 🤔";
}

// Envia mensagem de volta pelo Instagram
async function sendMessage(recipientId, text) {
  await fetch(`https://graph.facebook.com/v15.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  });
}

app.listen(3000, () => console.log("Bot rodando na porta 3000"));
