// =====================================================================
// GALERIA DE ILUSTRAÇÕES — junta as páginas de todos os PDFs do
// manifesto numa grade só. Clicar abre um visualizador ampliado com
// zoom, navegação e comentário por ilustração.
// =====================================================================
import { renderPdfPages } from './pdf-utils.js';
import { makeThreadId, subscribeToThread, postComment, formatTimestamp } from './comments.js';

const RENDER_SCALE_TARGET_WIDTH = 1400;
const ZOOM_MIN = 0.6;
const ZOOM_MAX = 3;
const ZOOM_STEP = 1.25;

export function initGallery({ book, manifestUrl, baseFolder }) {
  const els = {
    sub: document.getElementById('reader-subheading'),
    grid: document.getElementById('gallery-grid'),
    lightbox: document.getElementById('lightbox'),
    lbImg: document.getElementById('lightbox-img'),
    lbClose: document.getElementById('lightbox-close'),
    lbPrev: document.getElementById('lightbox-prev'),
    lbNext: document.getElementById('lightbox-next'),
    lbZoomOut: document.getElementById('lb-zoom-out'),
    lbZoomIn: document.getElementById('lb-zoom-in'),
    lbZoomLevel: document.getElementById('lb-zoom-level'),
    lbProgress: document.getElementById('lb-progress'),
    lbCommentBtn: document.getElementById('lb-comment-btn'),
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

  let items = []; // { docId, docTitle, pageNum, src }
  let currentIndex = 0;
  let zoomLevel = 1;
  let unsub = null;
  let currentComments = [];

  async function init() {
    let manifest;
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

    els.sub.textContent = 'carregando ilustrações…';
    for (const doc of manifest) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const images = await renderPdfPages(baseFolder + doc.file, RENDER_SCALE_TARGET_WIDTH, (done, total) => {
          els.sub.textContent = `carregando ${doc.title}… ${done}/${total}`;
        });
        images.forEach((src, i) => items.push({ docId: doc.id, docTitle: doc.title, pageNum: i + 1, src }));
      } catch (e) {
        console.error(`não foi possível abrir ${baseFolder}${doc.file}`, e);
      }
    }

    if (!items.length) {
      renderEmptyState();
      return;
    }

    els.sub.textContent = `${items.length} ilustraç${items.length === 1 ? 'ão' : 'ões'}`;
    els.grid.innerHTML = items
      .map(
        (it, i) => `
        <button class="gallery-item" data-index="${i}" type="button" aria-label="Abrir ilustração ${i + 1}">
          <img src="${it.src}" alt="${escapeHtml(it.docTitle)} — página ${it.pageNum}" loading="lazy">
          <span class="gallery-item-num">${i + 1}</span>
        </button>`
      )
      .join('');
    els.grid.querySelectorAll('.gallery-item').forEach((btn) => {
      btn.addEventListener('click', () => openLightbox(Number(btn.dataset.index)));
    });

    wireLightbox();
  }

  function renderEmptyState() {
    els.sub.textContent = 'nenhuma ilustração cadastrada ainda';
    els.grid.innerHTML = `
      <div class="page-cover" style="grid-column:1/-1;margin:2rem auto;">
        <svg class="flourish" viewBox="0 0 64 18" aria-hidden="true"><path d="M2 9 C 16 -2, 24 20, 32 9 S 48 -2, 62 9"/></svg>
        <h2>Ainda vazio</h2>
        <p style="max-width:26ch;color:var(--text-ink-soft);font-size:.9rem;">Adicione um PDF na pasta <code>${baseFolder}</code> e cadastre-o em <code>${manifestUrl}</code> para ela aparecer aqui.</p>
      </div>`;
  }

  function wireLightbox() {
    els.lbClose.addEventListener('click', closeLightbox);
    els.lbPrev.addEventListener('click', () => openLightbox(currentIndex - 1));
    els.lbNext.addEventListener('click', () => openLightbox(currentIndex + 1));
    els.lbZoomOut.addEventListener('click', () => setZoom(zoomLevel / ZOOM_STEP));
    els.lbZoomIn.addEventListener('click', () => setZoom(zoomLevel * ZOOM_STEP));
    els.lbCommentBtn.addEventListener('click', () => togglePanel(true));
    els.tab.addEventListener('click', () => togglePanel());
    els.panelClose.addEventListener('click', () => togglePanel(false));
    els.commentSubmit.addEventListener('click', submitComment);
    document.addEventListener('keydown', (e) => {
      if (els.lightbox.classList.contains('is-hidden')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') openLightbox(currentIndex - 1);
      if (e.key === 'ArrowRight') openLightbox(currentIndex + 1);
    });
  }

  function openLightbox(index) {
    if (index < 0 || index >= items.length) return;
    currentIndex = index;
    const it = items[currentIndex];
    els.lbImg.src = it.src;
    els.lbImg.alt = `${it.docTitle} — página ${it.pageNum}`;
    els.lbImg.style.width = '';
    zoomLevel = 1;
    updateZoomLabel();
    els.lbProgress.textContent = `${currentIndex + 1} / ${items.length}`;
    els.lbPrev.disabled = currentIndex === 0;
    els.lbNext.disabled = currentIndex === items.length - 1;
    els.lightbox.classList.remove('is-hidden');
    els.tab.classList.remove('is-hidden');
    openPageThread(it.docId, it.pageNum);
  }

  function closeLightbox() {
    els.lightbox.classList.add('is-hidden');
    els.tab.classList.add('is-hidden');
    togglePanel(false);
    if (unsub) { unsub(); unsub = null; }
  }

  function setZoom(next) {
    zoomLevel = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
    const baseW = els.lbImg.naturalWidth ? Math.min(els.lbImg.naturalWidth, 900) : 600;
    els.lbImg.style.width = `${Math.round(baseW * zoomLevel)}px`;
    updateZoomLabel();
  }

  function updateZoomLabel() {
    els.lbZoomLevel.textContent = `${Math.round(zoomLevel * 100)}%`;
    els.lbZoomOut.disabled = zoomLevel <= ZOOM_MIN + 0.001;
    els.lbZoomIn.disabled = zoomLevel >= ZOOM_MAX - 0.001;
  }

  async function openPageThread(docId, pageNum) {
    els.pageLabel.textContent = `· ilustração ${currentIndex + 1}`;
    if (unsub) unsub();
    const threadId = makeThreadId(book, docId, pageNum);
    unsub = await subscribeToThread(threadId, (list) => {
      currentComments = list;
      renderPanel();
    });
  }

  function renderPanel() {
    els.count.textContent = currentComments.length;
    if (!currentComments.length) {
      els.list.innerHTML = '<p class="marginalia-empty">Ainda não há comentários nesta ilustração. Seja a primeira pessoa a escrever uma.</p>';
      return;
    }
    els.list.innerHTML = currentComments
      .map(
        (c) => `
        <div class="note-card">
          <div class="note-body">${escapeHtml(c.text)}</div>
          <div class="note-meta">${escapeHtml(c.authorName || 'Anônimo')} · ${formatTimestamp(c.createdAt)}</div>
        </div>`
      )
      .join('');
  }

  async function submitComment() {
    const it = items[currentIndex];
    if (!els.commentText.value.trim() || !it) return;
    els.commentSubmit.disabled = true;
    try {
      const threadId = makeThreadId(book, it.docId, it.pageNum);
      await postComment(threadId, {
        text: els.commentText.value,
        authorName: els.commentName.value,
        extra: { book, docId: it.docId, pageIndex: it.pageNum },
      });
      els.commentText.value = '';
    } catch (e) {
      if (e.message === 'firebase-not-configured') {
        alert('O banco de comentários ainda não foi configurado. Veja README.md → "Configurar o banco de comentários".');
      } else {
        alert('Não deu para salvar o comentário. Tente de novo em instantes.');
      }
      console.error(e);
    } finally {
      els.commentSubmit.disabled = false;
    }
  }

  function togglePanel(force) {
    const open = force ?? !els.panel.classList.contains('is-open');
    els.panel.classList.toggle('is-open', open);
    els.tab.setAttribute('aria-expanded', String(open));
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  init();
}
