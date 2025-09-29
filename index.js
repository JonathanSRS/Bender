import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import dialogflow from "@google-cloud/dialogflow";
import { v4 as uuid } from "uuid";

// =======================
// Preparar credenciais GCP
// =======================
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  const credPath = "/tmp/google-credentials.json";
  fs.writeFileSync(
    credPath,
    process.env.GOOGLE_CREDENTIALS_JSON,
    { encoding: "utf8" }
  );
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
  console.log("Credenciais do Dialogflow gravadas em", credPath);
}

// =======================
// Configuração
// =======================
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const PROJECT_ID = process.env.PROJECT_ID;

// Cliente Dialogflow ES
const sessionClient = new dialogflow.SessionsClient();

const app = express();
app.use(express.json());

// =======================
// Rota de verificação Webhook
// =======================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("GET /webhook recebido:", req.query);

  if (mode && token === VERIFY_TOKEN) {
    console.log("Webhook verificado com sucesso!");
    return res.status(200).send(challenge);
  }

  console.error("Falha na verificação do webhook");
  res.sendStatus(403);
});

// =======================
// Receber mensagens Instagram
// =======================
app.post("/webhook", async (req, res) => {
  console.log("POST /webhook recebido:", JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body.entry?.[0];
    const messaging = entry?.messaging?.[0];
    const senderId = messaging?.sender?.id;
    const message = messaging?.message?.text;

    if (!senderId || !message) {
      console.warn("Mensagem ou senderId ausente no payload");
      return res.sendStatus(200);
    }

    console.log(`Mensagem recebida de ${senderId}: ${message}`);

    const resposta = await callDialogflow(message, senderId);
    console.log("Resposta do Dialogflow:", resposta);

    await sendMessage(senderId, resposta);
    console.log("Mensagem enviada de volta para Instagram");
  } catch (err) {
    console.error("Erro no processamento do webhook:", err);
  }

  res.sendStatus(200);
});

// =======================
// Função: chamar Dialogflow ES
// =======================
async function callDialogflow(text, sessionId) {
  try {
    const sessionPath = sessionClient.projectAgentSessionPath(
      PROJECT_ID,
      sessionId || uuid()
    );

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text,
          languageCode: "pt-BR",
        },
      },
    };

    console.log("Enviando para Dialogflow:", JSON.stringify(request, null, 2));

    const responses = await sessionClient.detectIntent(request);
    const result = responses[0]?.queryResult;

    console.log("Resposta bruta do Dialogflow:", JSON.stringify(result, null, 2));

    return result?.fulfillmentText || "Não entendi 🤔";
  } catch (err) {
    console.error("Erro ao chamar Dialogflow:", err);
    return "Erro ao processar sua mensagem 😢";
  }
}

// =======================
// Função: enviar mensagem ao Instagram
// =======================
async function sendMessage(recipientId, text) {
  try {
    console.log(`Enviando mensagem para ${recipientId}: ${text}`);

    const response = await fetch(
      `https://graph.facebook.com/v15.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text },
        }),
      }
    );

    const data = await response.json();
    console.log("Resposta do Graph API:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Erro ao enviar mensagem para Instagram:", err);
  }
}

// =======================
// Iniciar servidor
// =======================
app.listen(3000, () => console.log("🚀 Bot rodando na porta 3000"));
