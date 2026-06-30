// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyC7I5qlt_P5jI9OSvA-4xtcxRNbslZTxd8",
  authDomain: "estudex-corporation.firebaseapp.com",
  projectId: "estudex-corporation",
  storageBucket: "estudex-corporation.appspot.com", // corrigido
  messagingSenderId: "499791821676",
  appId: "1:499791821676:web:f715037da2584936a45149",
  measurementId: "G-L16EGZHEK6",
  databaseURL: "https://estudex-corporation-default-rtdb.firebaseio.com/"
};


// Importações
import {initializeApp} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {getAuth, onAuthStateChanged} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {GoogleAuthProvider, signInWithPopup, signOut} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {getDatabase, ref, set, get, update} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// Variáveis
const fonte_dos_recursos = initializeApp(firebaseConfig);
const auth = getAuth(fonte_dos_recursos); // Tem que ser carregado em type="module"
const db = getDatabase(fonte_dos_recursos); // Realtime Database
const provedor_da_Auth_Google = new GoogleAuthProvider();

let loginEmProgresso = false;

// Funções de Autenticação
async function debug_do_login_Google() {
  try {
    const result = await signInWithPopup(auth, provedor_da_Auth_Google);
    console.log("User:", result.user);
    console.log("Credenciais:", result.credential);
    return result;
  } catch (error) {
    console.error("Erro na autenticação:", error);
    throw error;
  }
}

async function real_login_do_Google(result) {
  try {
    if (!result || !result.user) {
      console.error("Resultado inválido:", result);
      return;
    }

    const user = result.user;
    const idToken = await user.getIdToken();
    
    // Salvar dados do usuário no Realtime Database
    await salvar_usuario_no_banco(user);
    
    console.log("Login bem-sucedido!", user.email);
    
    // Redirecionar para home.html após login bem-sucedido
    console.log("Redirecionando para home.html...");
    window.location.replace("./home.html");
    
  } catch (error) {
    console.error("Erro na autenticação:", error);
    loginEmProgresso = false;
  }
}

async function loginGoogle() {
  if (loginEmProgresso) return; // Previne múltiplos cliques
  loginEmProgresso = true;
  
  try {
    const result = await debug_do_login_Google();
    if (result) {
      await real_login_do_Google(result);
    }
  } catch (error) {
    console.error("Erro no login do google:", error);
    loginEmProgresso = false;
  }
}

// Funções do Realtime Database
async function salvar_usuario_no_banco(user) {
  try {
    const userRef = ref(db, 'usuarios/' + user.uid);
    await set(userRef, {
      uid: user.uid,
      email: user.email,
      nome: user.displayName,
      foto: user.photoURL,
      dataLogin: new Date().toISOString()
    });
    console.log("Usuário salvo no banco de dados");
  } catch (error) {
    console.error("Erro ao salvar usuário:", error);
    // Mesmo com erro na DB, continua com o login
  }
}

async function ler_dados_usuario(userId) {
  try {
    const userRef = ref(db, 'usuarios/' + userId);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      console.log("Dados do usuário:", snapshot.val());
      return snapshot.val();
    } else {
      console.log("Nenhum dado encontrado para este usuário");
      return null;
    }
  } catch (error) {
    console.error("Erro ao ler dados do usuário:", error);
  }
}

async function atualizar_dados_usuario(userId, dados) {
  try {
    const userRef = ref(db, 'usuarios/' + userId);
    await update(userRef, dados);
    console.log("Dados do usuário atualizados");
  } catch (error) {
    console.error("Erro ao atualizar dados do usuário:", error);
  }
}

async function salvar_questao_respondida(userId, questaoData) {
  try {
    const questaoRef = ref(db, 'usuarios/' + userId + '/questoes/' + Date.now());
    await set(questaoRef, questaoData);
    console.log("Questão salva no banco de dados");
  } catch (error) {
    console.error("Erro ao salvar questão:", error);
  }
}

// Ações
document.addEventListener("DOMContentLoaded", () => {
  const botaoLogin = document.getElementById('FazerLoginComGoogle');
  if (botaoLogin) {
    botaoLogin.addEventListener('click', async () => {
      const user = auth.currentUser;
      if (user) {
        console.log("Usuário já autenticado, redirecionando...");
        window.location.replace("./home.html");
      } else {
        console.log("Esperando o login google");
        await loginGoogle();
      }
    });
  }
});







// Verificar se já está autenticado ao carregar a página
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("Usuário já autenticado:", user);
    // Ler dados do usuário quando autenticado
    await ler_dados_usuario(user.uid);

    // Redirecionar automaticamente se já estiver logado
    if (window.location.pathname.endsWith("index.html")) {
      window.location.replace("./home.html");
    }
  } else {
    console.log("Nenhum usuário autenticado.");
  }
});


// Exportar funções para uso em outros arquivos
export { db, auth, ler_dados_usuario, atualizar_dados_usuario, salvar_questao_respondida };
