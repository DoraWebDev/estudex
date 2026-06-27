import express from "express";
import bodyParser from "body-parser";
import { pipeline } from "@xenova/transformers";

const app = express();
app.use(bodyParser.json());

const generator = await pipeline("text-generation", "Xenova/Qwen2-0.5B-Instruct");

app.post("/gerarQuestao", async (req, res) => {
  const { resumo } = req.body;

  const prompt = `
  Crie uma questão de múltipla escolha no seguinte formato:

  Pergunta: [texto da pergunta]
  Alternativas:
  A) [alternativa A]
  B) [alternativa B]
  C) [alternativa C]
  D) [alternativa D]
  Resposta: [letra da resposta correta]
  Explicação: [texto explicando a resposta]

  Resumo:
  ${resumo}
`;

  try {
    const output = await generator(prompt, {
      max_new_tokens: 120,
      temperature: 0.7,
      top_k: 50,
      top_p: 0.9,
    });
    res.json({ textoGerado: output[0].generated_text });
  } catch (err) {
    console.error("Erro ao gerar questão:", err);
    res.status(500).json({ error: "Falha ao gerar questão" });
  }
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
