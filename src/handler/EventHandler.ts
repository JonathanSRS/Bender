import Events from "../shared/Events";
import Message from "../models/message";
import sendDialogFlow from "../external/sendDialogFlow";
import SendAmazonLex from "../external/SendAmazonLex";

type StrategyFunction = (payload: Message) => Promise<void> | void;

export default class EventHandler {
    
    constructor(
        private readonly event: Events,
        private messagem: Message
    ){}

    private readonly eventStrategies: Record<string, StrategyFunction> = {
        [Events.DIALOG] : async (payload)=>{
            await new sendDialogFlow(payload.id, payload.message).execution()

        },
        [Events.AWS] : async (payload)=>{
            await new SendAmazonLex(payload.id, payload.message).execution()

        }
    }

    async executar(): Promise<void>{
        const strategy  = this.eventStrategies[this.event];

        if (!strategy) {
            throw new Error(`Estratégia não encontrada para o evento: ${this.event}`);
        }

        await strategy(this.messagem)
        
    }
}