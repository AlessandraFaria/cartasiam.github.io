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
//
// ⚠️ IMPORTANTE: troque só os VALORES dentro das aspas (onde está escrito
// COLE_AQUI e SEU-PROJETO). Não apague o "export const", não apague as
// chaves { }, e não cole o trecho inteiro que o Firebase mostra por
// cima disto — o Firebase mostra algo parecido mas SEM "export" na
// frente, e se você colar do jeito dele por cima deste arquivo, o site
// inteiro para de funcionar (não só os comentários). Se isso acontecer,
// dá pra conferir no Console do navegador (F12) se aparece um erro
// mencionando firebase-config.js.
// =====================================================================

export const firebaseConfig = {
  apiKey: "AIzaSyBGTAIRtkGF2XjnVZGajwDQPMhhaoZ-ZdU",
  authDomain: "cartas-para-iam.firebaseapp.com",
  projectId: "cartas-para-iam",
  storageBucket: "cartas-para-iam.firebasestorage.app",
  messagingSenderId: "310716527421",
  appId: "1:310716527421:web:1034d1ea6d1ed9d73ccb54"
};

// Nome da coleção do Firestore onde os comentários ficam guardados.
// Não precisa mexer aqui.
export const COMMENTS_COLLECTION = "comments";
