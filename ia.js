// Importações
import {db} from "./firebase.js";
import {pipeline} from "@xenova/transformers";


// Definição do modelo gerador
const generator = await pipeline("text-generation", "Xenova/Qwen2-0.5B-Instruct");

async function gerar_a_quest(resumo) {
  try {
    const response = await fetch("https://seu-dominio.com/gerarQuestao", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer SEU_TOKEN" 
      },
      body: JSON.stringify({ resumo }),
    });

    const data = await response.json();
    return data.textoGerado || "";
  } catch (err) {
    console.error("Erro ao conectar ao VPS:", err);
    return "Erro ao gerar questão.";
  }
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
