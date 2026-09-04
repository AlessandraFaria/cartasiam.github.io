// =====================================================================
// COMENTÁRIOS — camada de dados (Firebase Firestore)
// Compartilhado pelos três leitores (livro, anotações, ilustrações).
// =====================================================================
import { firebaseConfig, COMMENTS_COLLECTION } from './firebase-config.js';

let db = null;
let configured = isFirebaseConfigured();
let firestoreApi = null;

function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig &&
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'COLE_AQUI' &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== 'SEU-PROJETO'
  );
}

async function ensureFirestore() {
  if (!configured) return null;
  if (db) return db;
  try {
    const [{ initializeApp }, firestore] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js'),
    ]);
    firestoreApi = firestore;
    const app = initializeApp(firebaseConfig);
    db = firestore.getFirestore(app);
    return db;
  } catch (err) {
    console.error('[comentários] não foi possível iniciar o Firebase:', err);
    configured = false;
    return null;
  }
}

/** Chave única de "conversa" — evita precisar de índices compostos no Firestore. */
export function makeThreadId(book, a, b) {
  return [book, a ?? '', b ?? ''].join('::');
}

export function commentsConfigured() {
  return configured;
}

/**
 * Escuta em tempo real os comentários de uma thread.
 * @returns função para cancelar a escuta.
 */
export async function subscribeToThread(threadId, callback) {
  const database = await ensureFirestore();
  if (!database) {
    callback([]);
    return () => {};
  }
  const { collection, query, where, onSnapshot } = firestoreApi;
  const q = query(collection(database, COMMENTS_COLLECTION), where('threadId', '==', threadId));
  return onSnapshot(
    q,
    (snap) => {
      const items = [];
      snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      items.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      callback(items);
    },
    (err) => {
      console.error('[comentários] erro ao ler:', err);
      callback([]);
    }
  );
}

export async function postComment(threadId, data) {
  const database = await ensureFirestore();
  if (!database) throw new Error('firebase-not-configured');
  const { collection, addDoc, serverTimestamp } = firestoreApi;
  const clean = {
    threadId,
    text: String(data.text || '').trim().slice(0, 600),
    authorName: String(data.authorName || '').trim().slice(0, 40) || 'Anônimo',
    createdAt: serverTimestamp(),
  };
  if (!clean.text) throw new Error('empty-comment');
  Object.assign(clean, data.extra || {});
  await addDoc(collection(database, COMMENTS_COLLECTION), clean);
}

export function formatTimestamp(ts) {
  if (!ts?.seconds) return 'agora há pouco';
  const d = new Date(ts.seconds * 1000);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}
