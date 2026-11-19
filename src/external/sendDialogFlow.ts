import dialogflow from "@google-cloud/dialogflow";
import { v4 as uuid} from "uuid";
import type Flow from "../service/Flow.ts";
import fs from "fs";

export default class sendDialogFlow implements Flow{
    
    constructor(
        sessionId: string,
        text: string
    ){
        this.languageCode = "pt-BR";
        this.sessionId = sessionId;
        this.text = text;
    }
    
    private sessionId: string;
    private text: string;
    private sessionClient = new dialogflow.SessionsClient()
    public languageCode: string;

    session(): string {
        if (process.env.GOOGLE_CREDENTIALS_JSON) {
            const credPath = "./tmp/google-credentials.json";
            fs.writeFileSync(
                credPath,
                process.env.GOOGLE_CREDENTIALS_JSON,
                { encoding: "utf8" }
            );
            process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
            console.log("Credenciais do Dialogflow gravadas em", credPath);
        }
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
