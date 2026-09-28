// =====================================================================
// ESTANTE DE CADERNOS — mostra cada PDF do manifesto como uma capa de
// caderno. Clicar abre esse caderno específico no leitor de rolagem
// compartilhado (reader-scroll-core.js).
// =====================================================================
import { mountScrollDoc } from './reader-scroll-core.js';

export function initNotebookShelf({ book, manifestUrl, baseFolder }) {
  const els = {
    backLink: document.getElementById('back-link'),
    headingText: document.getElementById('reader-heading-text'),
    sub: document.getElementById('reader-subheading'),
    shelf: document.getElementById('notebook-shelf'),
    stage: document.getElementById('reader-stage'),
    controls: document.getElementById('reader-controls'),
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
      renderEmptyShelf();
      return;
    }

    setShelfStatus();
    els.shelf.innerHTML = manifest
      .map(
        (d) => `
        <button class="notebook-card" data-id="${d.id}" type="button" aria-label="Abrir ${escapeHtml(d.title)}">
          <span class="word">${escapeHtml(d.title)}</span>
        </button>`
      )
      .join('');
    els.shelf.querySelectorAll('.notebook-card').forEach((btn) => {
      btn.addEventListener('click', () => openNotebook(btn.dataset.id));
    });

    els.backLink.addEventListener('click', (e) => {
      if (els.stage.classList.contains('is-hidden')) return; // já na estante — deixa ir pro index normalmente
      e.preventDefault();
      closeNotebook();
    });

    const hashId = decodeURIComponent(location.hash.replace('#', ''));
    if (hashId && manifest.find((d) => d.id === hashId)) {
      openNotebook(hashId);
    }
  }

  function setShelfStatus() {
    els.sub.textContent = `${manifest.length} caderno${manifest.length === 1 ? '' : 's'} · escolha um pra abrir`;
  }

  function renderEmptyShelf() {
    els.sub.textContent = 'nenhum caderno cadastrado ainda';
    els.shelf.innerHTML = `
      <div class="page-cover" style="margin:2rem auto;">
        <svg class="flourish" viewBox="0 0 64 18" aria-hidden="true"><path d="M2 9 C 16 -2, 24 20, 32 9 S 48 -2, 62 9"/></svg>
        <h2>Ainda vazio</h2>
        <p style="max-width:26ch;color:var(--text-ink-soft);font-size:.9rem;">Adicione um PDF na pasta <code>${baseFolder}</code> e cadastre-o em <code>${manifestUrl}</code> para ele aparecer aqui.</p>
      </div>`;
  }

  async function openNotebook(docId) {
    const meta = manifest.find((d) => d.id === docId);
    if (!meta) return;
    location.hash = encodeURIComponent(docId);

    els.shelf.classList.add('is-hidden');
    els.stage.classList.remove('is-hidden');
    els.controls.classList.remove('is-hidden');
    els.tab.classList.remove('is-hidden');
    els.backLink.textContent = '← cadernos';
    els.headingText.textContent = meta.title;
    els.sub.textContent = 'carregando…';

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

  function closeNotebook() {
    if (destroyCurrent) {
      destroyCurrent();
      destroyCurrent = null;
    }
    els.stage.classList.add('is-hidden');
    els.controls.classList.add('is-hidden');
    els.tab.classList.add('is-hidden');
    els.shelf.classList.remove('is-hidden');
    els.backLink.textContent = '← estante';
    els.headingText.textContent = 'Anotações da Autora';
    setShelfStatus();
    history.replaceState(null, '', location.pathname + location.search);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  init();
}
