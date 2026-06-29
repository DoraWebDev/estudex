// server.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import fs from "fs/promises";
import dotenv from "dotenv";




dotenv.config();
const app = express();




// Segurança e parsing
app.use(helmet());
app.use(express.json());




// CORS: restrinja para seu front-end
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "https://seu-front.exemplo"
}));




// Rate limiting básico
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60, // max 60 requisições por IP por minuto
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);




// Token de autenticação simples (defina em .env)
const AUTH_TOKEN = process.env.API_TOKEN || "troque_este_token_em_producao";




// Rota para registrar cliques
app.post("/api/registrar-clique", async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ") || auth.split(" ")[1] !== AUTH_TOKEN) {
      return res.status(401).json({ error: "Unauthorized" });
    }


    const dados = req.body;


    // Validação mínima
    if (typeof dados.cardIndex === "undefined" || typeof dados.clientX === "undefined") {
      return res.status(400).json({ error: "Payload inválido" });
    }

    
    // Normalizar / sanitizar campos essenciais
    const registro = {
      cardIndex: Number(dados.cardIndex),
      cardId: dados.cardId || null,
      elementTag: String(dados.elementTag || ""),
      elementClasses: String(dados.elementClasses || ""),
      clientX: Number(dados.clientX),
      clientY: Number(dados.clientY),
      relativeX: Number(dados.relativeX || 0),
      relativeY: Number(dados.relativeY || 0),
      percentX: Number(dados.percentX || 0),
      percentY: Number(dados.percentY || 0),
      timestamp: new Date().toISOString(),
      userAgent: req.headers["user-agent"] || null,
      ip: req.ip
    };


    // Persistência simples: append em arquivo (substitua por DB em produção)
    await fs.appendFile("./clicks.log", JSON.stringify(registro) + "\n");


    // Resposta
    res.json({ status: "ok", receivedAt: new Date().toISOString() });
  } catch (err) {
    console.error("Erro ao registrar clique:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});




/*
  Sua rota de geração de questão.
  Observações:
  - Carregar modelos grandes no topo pode travar o processo.
  - Recomendo mover o carregamento do pipeline para um worker, processo separado,
    ou fazer lazy-load na primeira requisição com controle de concorrência.
*/




// Exemplo de lazy-load do generator
let generator = null;
async function getGenerator() {
  if (generator) return generator;
  // carregue aqui de forma controlada
  const { pipeline } = await import("@xenova/transformers");
  generator = await pipeline("text-generation", "Xenova/Qwen2-0.5B-Instruct");
  return generator;
}

app.post("/gerarQuestion", async (req, res) => {
  const { resumo } = req.body;
  if (!resumo) return res.status(400).json({ error: "Resumo é obrigatório" });

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
    const gen = await getGenerator();
    const output = await gen(prompt, {
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
