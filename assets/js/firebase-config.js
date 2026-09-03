// =====================================================================
// CONFIGURAÇÃO DO FIREBASE
// =====================================================================
// Preencha com as chaves do SEU projeto Firebase (é grátis).
// Passo a passo completo em README.md → "Configurar o banco de comentários".
//
// 1. Crie um projeto em https://console.firebase.google.com
// 2. Ative o "Firestore Database" (modo produção)
// 3. Em Configurações do projeto → Seus apps → adicione um app da Web
// 4. Copie o objeto de configuração que aparece e cole abaixo
// =====================================================================

export const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "SEU-PROJETO.firebaseapp.com",
  projectId: "SEU-PROJETO",
  storageBucket: "SEU-PROJETO.appspot.com",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
};

// Nome da coleção do Firestore onde os comentários ficam guardados.
// Não precisa mexer aqui.
export const COMMENTS_COLLECTION = "comments";
