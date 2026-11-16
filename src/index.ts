import express from "express";
import SendController from "./controller/sendController";
// import dotenv from "dotenv"

const app = express();
const porta = process.env.API_PORT ?? 3000
app.use(express.json());
app.use(express.urlencoded({ extended: true}))

app.listen(porta, () => console.log(`🚀 Bot rodando na porta ${porta}`));

new SendController(app)