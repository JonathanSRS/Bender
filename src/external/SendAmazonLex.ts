import { LexRuntimeV2Client, RecognizeTextCommand } from "@aws-sdk/client-lex-runtime-v2";
import { v4 as uuid } from "uuid";
import Flow from "../service/Flow";


export default class SendAmazonLex implements Flow {
    public languageCode: string;
    private client = new LexRuntimeV2Client({
        region: process.env.AWS_REGION || "us-east-1",
    });

    constructor(
        private sessionId: string,
        private text: string
    ) {
        this.languageCode = "pt_BR";
    }

    session(): string {
        return this.sessionId || uuid();
    }

    prompt(text: string): string {
        return text;
    }

    async execution(): Promise<string> {
    const command = new RecognizeTextCommand({
        botId: process.env.LEX_BOT_ID ?? "",
        botAliasId: process.env.LEX_BOT_ALIAS_ID ?? "TSTALIASID",
        localeId: this.languageCode,
        sessionId: this.session(),
        text: this.prompt(this.text),
    });

    const response = await this.client.send(command);
    const messages = response.messages?.map((m) => m.content).join("\n");

    return messages || "Não entendi 🤔";
    }
}
