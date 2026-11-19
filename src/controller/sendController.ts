import type { Express } from "express";
import EventHandler from "../handler/EventHandler.ts";
import Events from "../shared/Events.ts";

export default class SendController {

    constructor(
        servidor: Express
    ){
        servidor.post("/webhook", async (req, res) => {
            console.log("POST /webhook recebido:", JSON.stringify(req.body, null, 2));
            try {
                const entry = req.body.entry?.[0];
                const messaging = entry?.messaging?.[0];
                const resposta = await new EventHandler({
                    id:messaging?.sender?.id,
                    message: messaging?.message?.text
                }, Events.DIALOG).executar();
                console.log("Resposta do Dialogflow:", resposta);
            } catch (err) {
                console.error("Erro no processamento do webhook:", err);
            }
            res.sendStatus(200);
            }
        );
    }

}