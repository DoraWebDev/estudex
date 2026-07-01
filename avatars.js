// avatars.js - Gerenciamento de avatares com desbloqueio por pontos

import { 
  getStorage, 
  ref as sref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

import { 
  getDatabase, 
  ref as dbRef, 
  set, 
  get,
  update,
  onValue,
  off
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const storage = getStorage();
const db = getDatabase();
const auth = getAuth();

// ============ ADMIN: UPLOAD DE AVATARES ============

/**
 * Fazer upload de um avatar para Firebase Storage e gravar metadados
 * @param {File} file - Arquivo de imagem
 * @param {string} id - ID único do avatar (ex: "avatar1", "avatar2")
 * @param {number} pontosNecessarios - Pontos necessários para desbloquear
 * @param {string} label - Nome/label do avatar
 * @returns {Promise<string>} URL do avatar
 */
export async function uploadAvatar(file, id, pontosNecessarios, label) {
  try {
    // Validação básica
    if (!file || !id || typeof pontosNecessarios !== 'number' || !label) {
      throw new Error("Parâmetros inválidos: file, id, pontosNecessarios e label são obrigatórios");
    }

    if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type)) {
      throw new Error("Apenas PNG, JPEG e SVG são aceitos");
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      throw new Error("Arquivo muito grande (máximo 5MB)");
    }

    // Upload do arquivo principal
    const path = `avatars/${id}.png`;
    const storageRef = sref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    // Gravar metadados no Realtime Database
    await set(dbRef(db, `assets/avatars/${id}`), {
      id,
      label,
      file: url,
      pontosNecessarios,
      createdAt: new Date().toISOString(),
      ativo: true
    });

    console.log("Avatar enviado com sucesso:", id);
    return url;
  } catch (error) {
    console.error("Erro ao fazer upload do avatar:", error);
    throw error;
  }
}

/**
 * Deletar um avatar (apenas admin)
 * @param {string} id - ID do avatar
 */
export async function deleteAvatar(id) {
  try {
    // Deletar arquivo do Storage
    const path = `avatars/${id}.png`;
    const storageRef = sref(storage, path);
    await deleteObject(storageRef);

    // Deletar metadados do Database
    await set(dbRef(db, `assets/avatars/${id}`), null);

    console.log("Avatar deletado:", id);
  } catch (error) {
    console.error("Erro ao deletar avatar:", error);
    throw error;
  }
}

// ============ CARREGAMENTO E EXIBIÇÃO DE AVATARES ============

/**
 * Carregar todos os avatares disponíveis
 * @returns {Promise<Object>} Objeto com todos os avatares
 */
export async function loadAvatars() {
  try {
    const snapshot = await get(dbRef(db, 'assets/avatars'));
    return snapshot.exists() ? snapshot.val() : {};
  } catch (error) {
    console.error("Erro ao carregar avatares:", error);
    return {};
  }
}

/**
 * Carregar avatares do usuário (desbloqueados)
 * @param {string} uid - ID do usuário
 * @returns {Promise<Object>} Objeto com avatares desbloqueados
 */
export async function loadUserAvatars(uid) {
  try {
    const snapshot = await get(dbRef(db, `usuarios/${uid}/avatares`));
    return snapshot.exists() ? snapshot.val() : {};
  } catch (error) {
    console.error("Erro ao carregar avatares do usuário:", error);
    return {};
  }
}

/**
 * Obter avatar ativo do usuário
 * @param {string} uid - ID do usuário
 * @returns {Promise<string|null>} ID do avatar ativo
 */
export async function getAvatarAtivo(uid) {
  try {
    const snapshot = await get(dbRef(db, `usuarios/${uid}/avatarAtivo`));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error("Erro ao obter avatar ativo:", error);
    return null;
  }
}

/**
 * Obter pontos totais do usuário
 * @param {string} uid - ID do usuário
 * @returns {Promise<number>} Pontos totais
 */
export async function getUserPoints(uid) {
  try {
    const snapshot = await get(dbRef(db, `usuarios/${uid}/pontos`));
    return snapshot.exists() ? snapshot.val() : 0;
  } catch (error) {
    console.error("Erro ao obter pontos do usuário:", error);
    return 0;
  }
}

/**
 * Renderizar grade de avatares na UI
 * @param {HTMLElement} container - Container onde renderizar
 * @param {Object} avatarsMap - Mapa de avatares disponíveis
 * @param {Object} userAvatares - Avatares desbloqueados do usuário
 * @param {string} avatarAtivo - ID do avatar ativo
 * @param {number} userPoints - Pontos totais do usuário
 * @param {Function} onSelectAvatar - Callback ao selecionar avatar
 */
export function renderAvatars(container, avatarsMap, userAvatares, avatarAtivo, userPoints, onSelectAvatar) {
  if (!container) return;

  container.innerHTML = '';

  Object.entries(avatarsMap).forEach(([id, meta]) => {
    const unlocked = userAvatares && userAvatares[id];
    const isActive = avatarAtivo === id;
    const needsMorePoints = userPoints < (meta.pontosNecessarios || 0);

    const card = document.createElement('div');
    card.className = 'avatar-card';
    if (isActive) card.classList.add('active');
    if (!unlocked) card.classList.add('locked');

    const opacity = unlocked ? '1' : '0.4';
    const lockIcon = !unlocked ? '🔒' : '';

    card.innerHTML = `
      <div class="avatar-card-image">
        <img src="${meta.file}" alt="${meta.label}" class="avatar-thumb" style="opacity: ${opacity}">
        <div class="avatar-lock">${lockIcon}</div>
      </div>
      <div class="avatar-card-meta">
        <div class="avatar-label">${meta.label}</div>
        ${!unlocked ? `<div class="avatar-points-needed">${meta.pontosNecessarios} pontos</div>` : ''}
        ${isActive ? `<div class="avatar-badge">✓ Ativo</div>` : ''}
      </div>
    `;

    card.onclick = () => {
      if (!unlocked && needsMorePoints) {
        alert(`Você precisa de ${meta.pontosNecessarios} pontos para desbloquear este avatar. Você tem ${userPoints} pontos.`);
        return;
      }
      if (!unlocked) {
        alert("Este avatar ainda não foi desbloqueado");
        return;
      }
      if (onSelectAvatar) {
        onSelectAvatar(id);
      }
    };

    container.appendChild(card);
  });
}

/**
 * Definir avatar ativo do usuário
 * @param {string} uid - ID do usuário
 * @param {string} avatarId - ID do avatar
 */
export async function setAvatarAtivo(uid, avatarId) {
  try {
    await update(dbRef(db, `usuarios/${uid}`), { avatarAtivo: avatarId });
    console.log("Avatar ativo alterado para:", avatarId);
  } catch (error) {
    console.error("Erro ao definir avatar ativo:", error);
    throw error;
  }
}

/**
 * Desbloquear avatares automáticamente quando usuário atinge pontos
 * @param {string} uid - ID do usuário
 * @param {number} pontosTotais - Pontos totais do usuário
 * @returns {Promise<Array>} Array com IDs dos avatares desbloqueados nesta chamada
 */
export async function checkAndUnlockAvatars(uid, pontosTotais) {
  try {
    const avatarsSnap = await get(dbRef(db, 'assets/avatars'));
    if (!avatarsSnap.exists()) return [];

    const avatars = avatarsSnap.val();
    const userAvatarsSnap = await get(dbRef(db, `usuarios/${uid}/avatares`));
    const userAvatares = userAvatarsSnap.exists() ? userAvatarsSnap.val() : {};

    const newUnlocks = [];
    const updates = {};

    for (const [id, meta] of Object.entries(avatars)) {
      if (meta.pontosNecessarios && pontosTotais >= meta.pontosNecessarios && !userAvatares[id]) {
        updates[`avatares/${id}`] = true;
        newUnlocks.push(id);
      }
    }

    if (Object.keys(updates).length > 0) {
      await update(dbRef(db, `usuarios/${uid}`), updates);
      console.log("Avatares desbloqueados:", newUnlocks);
    }

    return newUnlocks;
  } catch (error) {
    console.error("Erro ao desbloquear avatares:", error);
    return [];
  }
}

/**
 * Inicializar avatares de um novo usuário com o avatar "idle"
 * @param {string} uid - ID do usuário
 */
export async function initializeUserAvatars(uid) {
  try {
    const userRef = dbRef(db, `usuarios/${uid}`);
    await update(userRef, {
      avatares: { idle: true },
      avatarAtivo: 'idle',
      pontos: 0,
      acertos: 0
    });
    console.log("Avatares inicializados para novo usuário:", uid);
  } catch (error) {
    console.error("Erro ao inicializar avatares:", error);
  }
}

/**
 * Listener em tempo real para alterações de avatares do usuário
 * @param {string} uid - ID do usuário
 * @param {Function} callback - Função chamada quando avatares mudam
 * @returns {Function} Função para remover o listener
 */
export function onUserAvatarsChanged(uid, callback) {
  const ref = dbRef(db, `usuarios/${uid}/avatares`);
  onValue(ref, (snapshot) => {
    const avatares = snapshot.exists() ? snapshot.val() : {};
    callback(avatares);
  });

  // Retornar função para desinscrever
  return () => off(ref);
}

/**
 * Listener em tempo real para avatar ativo do usuário
 * @param {string} uid - ID do usuário
 * @param {Function} callback - Função chamada quando avatar ativo muda
 * @returns {Function} Função para remover o listener
 */
export function onAvatarAtivoChanged(uid, callback) {
  const ref = dbRef(db, `usuarios/${uid}/avatarAtivo`);
  onValue(ref, (snapshot) => {
    const avatarAtivo = snapshot.exists() ? snapshot.val() : null;
    callback(avatarAtivo);
  });

  // Retornar função para desinscrever
  return () => off(ref);
}

/**
 * Listener em tempo real para pontos do usuário
 * @param {string} uid - ID do usuário
 * @param {Function} callback - Função chamada quando pontos mudam
 * @returns {Function} Função para remover o listener
 */
export function onUserPointsChanged(uid, callback) {
  const ref = dbRef(db, `usuarios/${uid}/pontos`);
  onValue(ref, (snapshot) => {
    const pontos = snapshot.exists() ? snapshot.val() : 0;
    callback(pontos);
  });

  // Retornar função para desinscrever
  return () => off(ref);
}

// ============ EXPORT DEFAULT ============

export default {
  uploadAvatar,
  deleteAvatar,
  loadAvatars,
  loadUserAvatars,
  getAvatarAtivo,
  getUserPoints,
  renderAvatars,
  setAvatarAtivo,
  checkAndUnlockAvatars,
  initializeUserAvatars,
  onUserAvatarsChanged,
  onAvatarAtivoChanged,
  onUserPointsChanged
};
