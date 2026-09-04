// =====================================================================
// LEITOR DE PDF SIMPLES — rolagem contínua com zoom, como o leitor de
// PDF nativo do navegador. Usado pelos três volumes (livro, anotações
// e ilustrações). Comentários são por página.
// =====================================================================
import { makeThreadId, subscribeToThread, postComment, formatTimestamp } from './comments.js';

const RENDER_SCALE_TARGET_WIDTH = 1400; // resolução-base do render — dá espaço pra dar zoom sem borrar
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 1.2;

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

  // eslint-disable-next-line no-undef
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/vendor/pdfjs/pdf.worker.min.js';

  let manifest = [];
  let currentDoc = null;
  let unsub = null;
  let currentComments = [];
  let currentPageNum = 1;
  let totalPages = 0;
  let baseWidth = 600; // largura de referência (zoom 100%), calculada ao carregar
  let zoomLevel = 1;
  let observer = null;

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
    els.prev.addEventListener('click', () => goToPage(currentPageNum - 1));
    els.next.addEventListener('click', () => goToPage(currentPageNum + 1));
    els.zoomOut.addEventListener('click', () => setZoom(zoomLevel / ZOOM_STEP));
    els.zoomIn.addEventListener('click', () => setZoom(zoomLevel * ZOOM_STEP));
    els.tab.addEventListener('click', () => togglePanel());
    els.panelClose.addEventListener('click', () => togglePanel(false));
    els.commentSubmit.addEventListener('click', submitComment);

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
    currentDoc = meta;
    location.hash = encodeURIComponent(docId);
    els.select.value = docId;
    els.sub.textContent = 'carregando páginas…';
    if (observer) observer.disconnect();

    let pdf;
    try {
      // eslint-disable-next-line no-undef
      pdf = await pdfjsLib.getDocument(baseFolder + meta.file).promise;
    } catch (e) {
      els.sub.textContent = `não foi possível abrir ${baseFolder}${meta.file}`;
      console.error(e);
      return;
    }

    els.scroll.innerHTML = '';
    totalPages = pdf.numPages;
    baseWidth = Math.min(700, Math.max(280, els.stage.clientWidth - 32));
    zoomLevel = 1;
    updateZoomLabel();
    els.scroll.style.setProperty('--pdf-page-w', `${baseWidth}px`);

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
      const src = canvas.toDataURL('image/jpeg', 0.86);

      const wrapper = document.createElement('div');
      wrapper.className = 'pdf-page';
      wrapper.dataset.page = String(n);
      wrapper.innerHTML = `
        <img src="${src}" alt="Página ${n} de ${meta.title}" loading="lazy">
        <div class="pdf-page-number">${n}</div>
        <button class="page-comment-btn" data-page="${n}" type="button">comentar</button>`;
      els.scroll.appendChild(wrapper);

      els.sub.textContent = `carregando páginas… ${n}/${pdf.numPages}`;
    }

    els.sub.textContent = `${meta.title} · ${totalPages} página${totalPages === 1 ? '' : 's'}`;

    els.scroll.querySelectorAll('.page-comment-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        goToPage(Number(btn.dataset.page), { scroll: false });
        togglePanel(true);
      });
    });

    setupObserver();
    goToPage(1, { scroll: false });
    updateProgress();
  }

  // -------------------------------------------------------------------
  // Zoom: só muda a largura de referência das páginas — a imagem já foi
  // renderizada numa resolução alta o bastante pra não borrar.
  // -------------------------------------------------------------------
  function setZoom(next) {
    zoomLevel = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
    els.scroll.style.setProperty('--pdf-page-w', `${Math.round(baseWidth * zoomLevel)}px`);
    updateZoomLabel();
  }

  function updateZoomLabel() {
    els.zoomLevel.textContent = `${Math.round(zoomLevel * 100)}%`;
    els.zoomOut.disabled = zoomLevel <= ZOOM_MIN + 0.001;
    els.zoomIn.disabled = zoomLevel >= ZOOM_MAX - 0.001;
  }

  // -------------------------------------------------------------------
  // Navegação: rola até a página pedida. currentPageNum também é
  // atualizado sozinho enquanto a pessoa rola manualmente (ver observer).
  // -------------------------------------------------------------------
  function goToPage(n, opts = {}) {
    const target = Math.min(totalPages, Math.max(1, n));
    const el = els.scroll.querySelector(`.pdf-page[data-page="${target}"]`);
    if (el && opts.scroll !== false) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (target !== currentPageNum || opts.force) {
      openPageThread(target);
    }
    updateProgress();
  }

  function updateProgress() {
    els.progress.textContent = totalPages ? `página ${currentPageNum} de ${totalPages}` : '— / —';
    els.prev.disabled = currentPageNum <= 1;
    els.next.disabled = currentPageNum >= totalPages;
  }

  // -------------------------------------------------------------------
  // Detecta qual página está mais visível enquanto a pessoa rola,
  // pra manter o indicador e o painel de comentários sincronizados.
  // -------------------------------------------------------------------
  function setupObserver() {
    if (observer) observer.disconnect();
    let best = { ratio: 0, page: currentPageNum };
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const n = Number(entry.target.dataset.page);
          if (entry.isIntersecting && entry.intersectionRatio > best.ratio) {
            best = { ratio: entry.intersectionRatio, page: n };
          }
        }
        if (best.page !== currentPageNum) {
          currentPageNum = best.page;
          updateProgress();
          openPageThread(currentPageNum);
        }
        best = { ratio: 0, page: currentPageNum };
      },
      { root: els.stage, threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    els.scroll.querySelectorAll('.pdf-page').forEach((el) => observer.observe(el));
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
