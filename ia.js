// Importações
import {db} from "./firebase.js";
import {pipeline} from "@xenova/transformers";


// Definição do modelo gerador
const generator = await pipeline("text-generation", "Xenova/Qwen2-0.5B-Instruct");

async function gerar_a_quest(resumo) {
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
  const output = await generator(prompt, {
    max_new_tokens: 120,
    min_new_tokens: 50,
    temperature: 0.7,
    top_k: 50,
    top_p: 0.9,
  });
  return output[0].generated_text;
}




// Parse
function parse_da_quest(textoGerado) {
  const regexPergunta = /Pergunta:\s*(.*)/i;
  const regexAlternativas = /Alternativas:\s*A\)(.*)\s*B\)(.*)\s*C\)(.*)\s*D\)(.*)/is;
  const regexResposta = /Resposta:\s*(.*)/i;
  const regexExplication = /Explicação:\s*(.*)/i;
  const explication = regexExplication.exec(textoGerado)?.[1]?.trim() || "";

  const pergunta = regexPergunta.exec(textoGerado)?.[1]?.trim() || "";
  const alternativasMatch = regexAlternativas.exec(textoGerado);
  const alternativas = alternativasMatch
    ? [alternativasMatch[1], alternativasMatch[2], alternativasMatch[3], alternativasMatch[4]].map(a => a.trim())
    : [];
  const respostaCorreta = regexResposta.exec(textoGerado)?.[1]?.trim() || "";

  return {pergunta, alternativas, respostaCorreta, explication};
}



async function pegar_os_resumos() {
  const caminhos = [
    "/resumos/quimica_setor_A",
    "/resumos/quimica_setor_B",
    "/resumos/fisica_setor_A",
    "/resumos/fisica_setor_B",
    "/resumos/computacao_e_mundo_digital",
    "/resumos/matematica_setor_A",
    "/resumos/matematica_setor_B",
  ];

  const promessas = caminhos.map(c => db.ref(c).once("value"));
  const snapshots = await Promise.all(promessas);
  return snapshots.map(s => s.val());
}


export {gerar_a_quest, parse_da_quest, pegar_os_resumos};
