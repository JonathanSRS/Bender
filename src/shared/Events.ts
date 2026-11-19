const Events = {
    DIALOG : "SEND_DIALOG",
    AWS : "SEND_AWS",
} as const
type Events = (typeof Events)[keyof typeof Events];
export default Events