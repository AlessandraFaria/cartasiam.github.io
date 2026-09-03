// =====================================================================
// LEITOR DE PDF (usado por anotações da autora e ilustrações)
// Renderiza cada página do PDF como imagem e usa o mesmo motor de
// folhear páginas do livro principal. Comentários são por página.
// =====================================================================
import { makeThreadId, subscribeToThread, postComment, formatTimestamp } from './comments.js';

const PAGE_W = 460;
const PAGE_H = 620;
const RENDER_SCALE_TARGET_WIDTH = 900;

export function initPdfReader({ book, manifestUrl, baseFolder }) {
  const els = {
    select: document.getElementById('chapter-select'),
    sub: document.getElementById('reader-subheading'),
    stage: document.getElementById('reader-stage'),
    flip: document.getElementById('book-flip'),
    prev: document.getElementById('prev-btn'),
    next: document.getElementById('next-btn'),
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

  // eslint-disable-next-line no-undef
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/vendor/pdfjs/pdf.worker.min.js';

  let manifest = [];
  let currentDoc = null;
  let pageFlip = null;
  let unsub = null;
  let currentComments = [];
  let currentPageNum = 1;

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

    els.select.innerHTML = manifest.map((d) => `<option value="${d.id}">${d.title}</option>`).join('');
    els.select.addEventListener('change', () => loadDoc(els.select.value));
    els.prev.addEventListener('click', () => pageFlip && pageFlip.flipPrev());
    els.next.addEventListener('click', () => pageFlip && pageFlip.flipNext());
    els.tab.addEventListener('click', () => togglePanel());
    els.panelClose.addEventListener('click', () => togglePanel(false));
    els.commentSubmit.addEventListener('click', submitComment);

    const hashId = decodeURIComponent(location.hash.replace('#', ''));
    const start = manifest.find((d) => d.id === hashId) || manifest[0];
    els.select.value = start.id;
    await loadDoc(start.id);
  }

  function renderEmptyShelf() {
    els.sub.textContent = 'nenhum arquivo cadastrado ainda';
    els.flip.innerHTML = `
      <div class="page page-cover" style="width:${PAGE_W}px;height:${PAGE_H}px;max-width:100%;max-height:100%;margin:0 auto;">
        <svg class="flourish" viewBox="0 0 64 18" aria-hidden="true"><path d="M2 9 C 16 -2, 24 20, 32 9 S 48 -2, 62 9"/></svg>
        <h2>Ainda vazio</h2>
        <p style="max-width:26ch;color:var(--text-ink-soft);font-size:.9rem;">Adicione um PDF na pasta <code>${baseFolder}</code> e cadastre-o em <code>${manifestUrl}</code> para ele aparecer aqui.</p>
      </div>`;
  }

  async function loadDoc(docId) {
    const meta = manifest.find((d) => d.id === docId);
    if (!meta) return;
    currentDoc = meta;
    location.hash = encodeURIComponent(docId);
    els.select.value = docId;
    els.sub.textContent = 'carregando páginas…';

    let pdf;
    try {
      // eslint-disable-next-line no-undef
      pdf = await pdfjsLib.getDocument(baseFolder + meta.file).promise;
    } catch (e) {
      els.sub.textContent = `não foi possível abrir ${baseFolder}${meta.file}`;
      console.error(e);
      return;
    }

    const images = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      // eslint-disable-next-line no-await-in-loop
      const page = await pdf.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const scale = RENDER_SCALE_TARGET_WIDTH / base.width;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      // eslint-disable-next-line no-await-in-loop
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      images.push(canvas.toDataURL('image/jpeg', 0.86));
      els.sub.textContent = `carregando páginas… ${n}/${pdf.numPages}`;
    }

    buildFlip(meta, images);
    els.sub.textContent = `${meta.title} · ${images.length} página${images.length === 1 ? '' : 's'}`;
  }

  function buildFlip(meta, images) {
    if (pageFlip) {
      pageFlip.destroy();
      els.flip.innerHTML = '';
    }
    const pageEls = images.map((src, i) => {
      const page = document.createElement('div');
      page.className = 'page';
      page.style.background = '#fff';
      page.innerHTML = `
        <img src="${src}" alt="Página ${i + 1} de ${meta.title}" style="width:100%;height:100%;object-fit:contain;background:#fff;">
        <button class="page-comment-btn" data-page="${i + 1}" type="button">comentar</button>
        <div class="page-number">${i + 1}</div>`;
      return page;
    });

    const bounds = computeFlipBounds();
    // eslint-disable-next-line no-undef
    pageFlip = new St.PageFlip(els.flip, {
      width: PAGE_W,
      height: PAGE_H,
      size: 'stretch',
      minWidth: Math.min(240, bounds.maxWidth),
      maxWidth: bounds.maxWidth,
      minHeight: Math.min(320, bounds.maxHeight),
      maxHeight: bounds.maxHeight,
      showCover: false,
      usePortrait: true,
      maxShadowOpacity: 0.5,
      mobileScrollSupport: false,
    });
    pageFlip.loadFromHTML(pageEls);
    pageFlip.on('flip', (e) => {
      updateProgress();
      openPageThread(e.data + 1);
    });
    updateProgress();
    openPageThread(1);

    els.flip.querySelectorAll('.page-comment-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        openPageThread(Number(btn.dataset.page));
        togglePanel(true);
      });
    });
  }

  function updateProgress() {
    if (!pageFlip) return;
    const cur = pageFlip.getCurrentPageIndex() + 1;
    const total = pageFlip.getPageCount();
    els.progress.textContent = `${cur} / ${total}`;
    els.prev.disabled = cur <= 1;
    els.next.disabled = cur >= total;
  }

  function computeFlipBounds() {
    const rect = els.stage.getBoundingClientRect();
    const availW = Math.max(240, rect.width - 8);
    const availH = Math.max(320, rect.height - 8);
    return {
      maxWidth: Math.floor(availW / 2),
      maxHeight: Math.floor(availH),
    };
  }

  async function openPageThread(pageNum) {
    currentPageNum = pageNum;
    els.pageLabel.textContent = `· página ${pageNum}`;
    if (unsub) unsub();
    const threadId = makeThreadId(book, currentDoc.id, pageNum);
    unsub = await subscribeToThread(threadId, (items) => {
      currentComments = items;
      renderPanel();
    });
  }

  function renderPanel() {
    els.count.textContent = currentComments.length;
    if (!currentComments.length) {
      els.list.innerHTML = '<p class="marginalia-empty">Ainda não há comentários nesta página. Seja a primeira pessoa a escrever uma.</p>';
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
    if (!els.commentText.value.trim() || !currentDoc) return;
    els.commentSubmit.disabled = true;
    try {
      const threadId = makeThreadId(book, currentDoc.id, currentPageNum);
      await postComment(threadId, {
        text: els.commentText.value,
        authorName: els.commentName.value,
        extra: { book, docId: currentDoc.id, pageIndex: currentPageNum },
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
