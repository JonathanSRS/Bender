import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// Configuração
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const DIALOGFLOW_TOKEN = process.env.DIALOGFLOW_TOKEN;
const PROJECT_ID = process.env.PROJECT_ID;

// Rota para verificação do webhook
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("GET /webhook recebida:", req.query);

  if (mode && token === VERIFY_TOKEN) {
    console.log("Webhook verificado com sucesso!");
    return res.status(200).send(challenge);
  }

  console.error("Falha na verificação do webhook");
  res.sendStatus(403);
});

// Receber mensagens do Instagram
app.post("/webhook", async (req, res) => {
  console.log("POST /webhook recebida:", JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body.entry?.[0];
    const messaging = entry?.messaging?.[0];
    const senderId = messaging?.sender?.id;
    const message = messaging?.message?.text;

    if (!senderId || !message) {
      console.warn("Mensagem ou senderId não encontrado no payload");
      return res.sendStatus(200); // apenas responde 200 para não gerar erro
    }

    console.log(`Mensagem recebida de ${senderId}: ${message}`);

    const dfResponse = await callDialogflow(message, senderId);
    console.log("Resposta do Dialogflow:", dfResponse);

    await sendMessage(senderId, dfResponse);
    console.log("Mensagem enviada de volta ao Instagram");
  } catch (err) {
    console.error("Erro no processamento da mensagem:", err);
  }

  res.sendStatus(200);
});

// Chama Dialogflow ES
async function callDialogflow(text, sessionId) {
  try {
    const url = `https://dialogflow.googleapis.com/v2/projects/${PROJECT_ID}/agent/sessions/${sessionId}:detectIntent`;

    const body = {
      queryInput: {
        text: { text, languageCode: "pt-BR" },
      },
    };

    console.log("Enviando requisição para Dialogflow:", JSON.stringify(body));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DIALOGFLOW_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log("Resposta bruta do Dialogflow:", JSON.stringify(data, null, 2));

    // Checagem de queryResult
    if (data && data.queryResult && data.queryResult.fulfillmentText) {
      return data.queryResult.fulfillmentText;
    } else {
      console.warn("Dialogflow não retornou fulfillmentText");
      return "Não entendi 🤔";
    }
  } catch (err) {
    console.error("Erro ao chamar Dialogflow:", err);
    return "Ocorreu um erro ao processar sua mensagem 😢";
  }
}

// Envia mensagem de volta pelo Instagram
async function sendMessage(recipientId, text) {
  try {
    console.log(`Enviando mensagem para ${recipientId}: ${text}`);

    const response = await fetch(`https://graph.facebook.com/v15.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    });

    const data = await response.json();
    console.log("Resposta do Graph API:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Erro ao enviar mensagem para o Instagram:", err);
  }
}

app.listen(3000, () => console.log("Bot rodando na porta 3000"));
