import express from "express";
import SendController from "./controller/SendController.ts";

const app = express();
const porta = process.env.API_PORT ?? 3000
app.use(express.json());
app.use(express.urlencoded({ extended: true}))

app.listen(porta, () => console.log(`🚀 Bot rodando na porta ${porta}`));

new SendController(app)