import Events from "../shared/Events.ts";
import type Message from "../models/message.ts";
import sendDialogFlow from "../external/SendDialogFlow.ts";
import SendAmazonLex from "../external/SendAmazonLex.ts";

type StrategyFunction = (payload: Message) => Promise<string> | string | void;

export default class EventHandler {
    
    constructor(
        message: Message,
        event: Events
    ){
        this.event = event;
        this.messagem = message
    }
    
    private readonly event: Events;
    private messagem: Message;
    private readonly eventStrategies: Record<string, StrategyFunction> = {
        [Events.DIALOG] : async (payload)=>{
            return await new sendDialogFlow(payload.id, payload.message).execution()

        },
        [Events.AWS] : async (payload)=>{
            return await new SendAmazonLex(payload.id, payload.message).execution()

        }
    }

    async executar(): Promise<string|void>{
        const strategy  = this.eventStrategies[this.event];

        if (!strategy) {
            throw new Error(`Estratégia não encontrada para o evento: ${this.event}`);
        }

        return await strategy(this.messagem)
        
    }
}