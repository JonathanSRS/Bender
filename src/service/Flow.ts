export default interface Flow{
    session(): string
    prompt(text: string) : string
    languageCode: string
    execution(): Promise<string>
}