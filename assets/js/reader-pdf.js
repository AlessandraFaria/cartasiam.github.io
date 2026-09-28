// =====================================================================
// LEITOR DO LIVRO PRINCIPAL — carrega o manifesto, deixa trocar de
// volume pelo seletor (se houver mais de um) e delega a renderização
// pro núcleo compartilhado (reader-scroll-core.js).
// =====================================================================
import { mountScrollDoc } from './reader-scroll-core.js';

export function initPdfReader({ book, manifestUrl, baseFolder }) {
  const els = {
    select: document.getElementById('chapter-select'),
    sub: document.getElementById('reader-subheading'),
    stage: document.getElementById('reader-stage'),
    scroll: document.getElementById('pdf-scroll'),
    prev: document.getElementById('prev-btn'),
    next: document.getElementById('next-btn'),
    zoomOut: document.getElementById('zoom-out'),
    zoomIn: document.getElementById('zoom-in'),
    zoomLevel: document.getElementById('zoom-level'),
    progress: document.getElementById('reader-progress'),
    tab: document.getElementById('marginalia-tab'),
    count: document.getElementById('marginalia-count'),
    panel: document.getElementById('marginalia-panel'),
    panelClose: document.getElementById('marginalia-close'),
    list: document.getElementById('marginalia-list'),
    pageLabel: document.getElementById('marginalia-page-label'),
    commentText: document.getElementById('page-comment-text'),
    commentName: document.getElementById('page-comment-name'),
    commentSubmit: document.getElementById('page-comment-submit'),
  };

  let manifest = [];
  let destroyCurrent = null;

  async function init() {
    try {
      manifest = await (await fetch(manifestUrl, { cache: 'no-store' })).json();
    } catch (e) {
      els.sub.textContent = `não foi possível carregar ${manifestUrl}`;
      console.error(e);
      return;
    }

    if (!manifest.length) {
      renderEmptyState();
      return;
    }

    els.select.innerHTML = manifest.map((d) => `<option value="${d.id}">${d.title}</option>`).join('');
    els.select.addEventListener('change', () => loadDoc(els.select.value));

    const hashId = decodeURIComponent(location.hash.replace('#', ''));
    const start = manifest.find((d) => d.id === hashId) || manifest[0];
    els.select.value = start.id;
    await loadDoc(start.id);
  }

  function renderEmptyState() {
    els.sub.textContent = 'nenhum arquivo cadastrado ainda';
    els.scroll.innerHTML = `
      <div class="page-cover">
        <svg class="flourish" viewBox="0 0 64 18" aria-hidden="true"><path d="M2 9 C 16 -2, 24 20, 32 9 S 48 -2, 62 9"/></svg>
        <h2>Ainda vazio</h2>
        <p style="max-width:26ch;color:var(--text-ink-soft);font-size:.9rem;">Adicione um PDF na pasta <code>${baseFolder}</code> e cadastre-o em <code>${manifestUrl}</code> para ele aparecer aqui.</p>
      </div>`;
  }

  async function loadDoc(docId) {
    const meta = manifest.find((d) => d.id === docId);
    if (!meta) return;
    location.hash = encodeURIComponent(docId);
    els.select.value = docId;

    if (destroyCurrent) destroyCurrent();
    destroyCurrent = await mountScrollDoc({
      book,
      docId: meta.id,
      docTitle: meta.title,
      pdfUrl: baseFolder + meta.file,
      els,
      onStatus: (msg) => { els.sub.textContent = msg; },
    });
  }

  init();
}
