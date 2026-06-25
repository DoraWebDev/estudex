// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyC7I5qlt_P5jI9OSvA-4xtcxRNbslZTxd8",
  authDomain: "estudex-corporation.firebaseapp.com",
  projectId: "estudex-corporation",
  storageBucket: "estudex-corporation.firebasestorage.app",
  messagingSenderId: "499791821676",
  appId: "1:499791821676:web:f715037da2584936a45149",
  measurementId: "G-L16EGZHEK6"
};

// Importações
import {initializeApp} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {getAuth, onAuthStateChanged} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {GoogleAuthProvider, signInWithPopup, signOut} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";


// Variáveis
const fonte_dos_recursos = initializeApp(firebaseConfig);
const auth = getAuth(fonte_dos_recursos); // Tem que ser carregado em type="module"
const provedor_da_Auth_Google = new GoogleAuthProvider();


// Funções
async function debug_do_login_Google() {
  try {
    const result = await signInWithPopup(auth, provedor_da_Auth_Google);
    console.log("User:", result.user);
    console.log("Credenciais:", result.credential);
    return result;
  } catch (error) {
    console.error("Erro na autenticação:", error);
  }
}

async function real_login_do_Google(result) {
  try {
    const idToken = await result.user.getIdToken();
    await fetch("/api/protegida", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    });
  } catch (error) {
    console.error("Erro na autenticação:", error);
  }
}

async function loginGoogle() {
  try {
    const result = await debug_do_login_Google();
    await real_login_do_Google(result);
  } catch (error) {
    console.error("Erro no login do google:", error);
  }
}




// Ações
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById('FazerLoginComGoogle')
    .addEventListener('click', loginGoogle);
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("Usuário autenticado:", user);
  } else {
    console.log("Nenhum usuário autenticado.");
  }
});
