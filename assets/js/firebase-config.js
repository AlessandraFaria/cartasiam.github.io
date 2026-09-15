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

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBGTAIRtkGF2XjnVZGajwDQPMhhaoZ-ZdU",
  authDomain: "cartas-para-iam.firebaseapp.com",
  projectId: "cartas-para-iam",
  storageBucket: "cartas-para-iam.firebasestorage.app",
  messagingSenderId: "310716527421",
  appId: "1:310716527421:web:1034d1ea6d1ed9d73ccb54"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Nome da coleção do Firestore onde os comentários ficam guardados.
// Não precisa mexer aqui.
export const COMMENTS_COLLECTION = "comments";
