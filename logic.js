// Importações
import {gerar_a_quest, parse_da_quest, pegar_os_resumos} from "./ia.js";
import {db} from "./firebase.js";

document.getElementById("escolha-certa").style.display = "none";
document.getElementById("escolha-errada").style.display = "none";


function resetarEstado() {
  document.getElementById("escolha-certa").style.display = "none";
  document.getElementById("escolha-errada").style.display = "none";
  const div_da_explication = document.getElementById("explication");
  div_da_explication.style.display = "none";
  div_da_explication.innerText = "";
}



async function configurar_os_buttons() {
  const resumos = await pegar_os_resumos();

  resumos.forEach((resumo, index) => {
    const playButton = document.getElementById(`playButton${index + 1}`);
    playButton.addEventListener("click", async () => {
      // Gera questão com base no resumo
      const textoGerado = await gerar_a_quest(resumo);
      const quest = parse_da_quest(textoGerado);

      if (!quest || !quest.pergunta || !quest.alternativas || quest.alternativas.length < 4 || !quest.respostaCorreta) {
        console.error("Questão inválida ou parser falhou:", quest);
        document.getElementById("pergunta").innerText = "Questão inválida. Tente novamente.";
        return;
      }

      // Mostra pergunta
      document.getElementById("pergunta").innerText = quest.pergunta;

      // Mostrar Alternativas
      document.querySelector("#alternativa_A + .checkbox-tile .checkbox-label").innerText = `A) ${quest.alternativas[0]}`;
      document.querySelector("#alternativa_B + .checkbox-tile .checkbox-label").innerText = `B) ${quest.alternativas[1]}`;
      document.querySelector("#alternativa_C + .checkbox-tile .checkbox-label").innerText = `C) ${quest.alternativas[2]}`;
      document.querySelector("#alternativa_D + .checkbox-tile .checkbox-label").innerText = `D) ${quest.alternativas[3]}`;


      verificar_a_resposta(quest);
    });
  });
}

function verificar_a_resposta(quest) {
  const alternativasIds = ["alternativa_A", "alternativa_B", "alternativa_C", "alternativa_D"];
  const letras = ["A", "B", "C", "D"];

  alternativasIds.forEach((id, idx) => {
    const input = document.getElementById(id);
    input.addEventListener("change", () => {
      const escolhida = letras[idx];
      if (escolhida === quest.respostaCorreta) {
        document.getElementById("escolha-certa").style.display = "block";
      } else {
        document.getElementById("escolha-errada").style.display = "block";
      }
      const div_da_explication = document.getElementById("explication");
      div_da_explication.style.display = "block";
      div_da_explication.innerText = quest.explication;
    });
  });
}


  const tickets = document.querySelectorAll(".ticket-wrapper");

  tickets.forEach((ticket, index) => {
    ticket.addEventListener("click", () => {
      console.log("Clicou no cartão:", index + 1);
      console.log("Elemento:", ticket);
    });
  });


configurar_os_buttons();
