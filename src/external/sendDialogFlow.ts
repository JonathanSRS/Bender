import dialogflow from "@google-cloud/dialogflow";
import { v4 as uuid, UUIDTypes } from "uuid";
import Flow from "../service/Flow";

export default class sendDialogFlow implements Flow{
    
    constructor(
        private sessionId: string,
        private text: string
    ){
        this.languageCode = "pt-BR";
    }
    
    private sessionClient = new dialogflow.SessionsClient()
    public languageCode: string;

    session(): string {
        return this.sessionClient.projectAgentSessionPath(
        process.env.PROJECT_ID ?? "",
        this.sessionId || uuid()
    );
    }
    prompt(text: string): string {
        return text
    }

    async execution(): Promise<string> {
            const request = {
                session: this.session(),
                queryInput: {
                    text: {
                        text: this.prompt(this.text),
                        languageCode: "pt-BR",
                    },
                },
            };

            const responses = await this.sessionClient.detectIntent(request);
            const result = responses[0]?.queryResult;

            const intent = result?.intent?.displayName || "default";
            const params = result?.parameters || {};
            const fulfillmentText = result?.fulfillmentText || "Não entendi 🤔";

            return fulfillmentText;
    }
    
}
//     if (intent === "Me diga mais sobre") {
//       const bebida = params.fields?.Bebida?.stringValue || text;
//       respostaFinal = await consultarServico("bebidas", bebida);
//     }
