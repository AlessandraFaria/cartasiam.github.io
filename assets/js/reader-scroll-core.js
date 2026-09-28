// =====================================================================
// Núcleo do leitor de rolagem contínua com zoom — usado pelo livro
// principal e por cada caderno de anotações individual.
// =====================================================================
import { renderPdfPages } from './pdf-utils.js';
import { makeThreadId, subscribeToThread, postComment, formatTimestamp } from './comments.js';

const RENDER_SCALE_TARGET_WIDTH = 1400;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 1.2;

/**
 * Monta o leitor de rolagem dentro dos elementos passados.
 * @returns {Promise<() => void>} função de limpeza (chame ao trocar de documento)
 */
export async function mountScrollDoc({ book, docId, docTitle, pdfUrl, els, onStatus }) {
  let unsub = null;
  let currentComments = [];
  let currentPageNum = 1;
  let totalPages = 0;
  let baseWidth = 600;
  let zoomLevel = 1;
  let observer = null;

  onStatus && onStatus('carregando páginas…');
  els.scroll.innerHTML = '';

  let images;
  try {
    images = await renderPdfPages(pdfUrl, RENDER_SCALE_TARGET_WIDTH, (done, total) => {
      onStatus && onStatus(`carregando páginas… ${done}/${total}`);
    });
  } catch (e) {
    onStatus && onStatus(`não foi possível abrir ${pdfUrl}`);
    console.error(e);
    return () => {};
  }

  totalPages = images.length;
  baseWidth = Math.min(700, Math.max(280, els.stage.clientWidth - 32));
  zoomLevel = 1;
  updateZoomLabel();
  els.scroll.style.setProperty('--pdf-page-w', `${baseWidth}px`);

  images.forEach((src, i) => {
    const n = i + 1;
    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-page';
    wrapper.dataset.page = String(n);
    wrapper.innerHTML = `
      <img src="${src}" alt="Página ${n} de ${docTitle}" loading="lazy">
      <div class="pdf-page-number">${n}</div>
      <button class="page-comment-btn" data-page="${n}" type="button">comentar</button>`;
    els.scroll.appendChild(wrapper);
  });

  onStatus && onStatus(`${docTitle} · ${totalPages} página${totalPages === 1 ? '' : 's'}`);

  els.scroll.querySelectorAll('.page-comment-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      goToPage(Number(btn.dataset.page), { scroll: false });
      togglePanel(true);
    });
  });

  function setZoom(next) {
    zoomLevel = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
    els.scroll.style.setProperty('--pdf-page-w', `${Math.round(baseWidth * zoomLevel)}px`);
    updateZoomLabel();
  }
  function updateZoomLabel() {
    if (!els.zoomLevel) return;
    els.zoomLevel.textContent = `${Math.round(zoomLevel * 100)}%`;
    els.zoomOut.disabled = zoomLevel <= ZOOM_MIN + 0.001;
    els.zoomIn.disabled = zoomLevel >= ZOOM_MAX - 0.001;
  }

  function goToPage(n, opts = {}) {
    const target = Math.min(totalPages, Math.max(1, n));
    const el = els.scroll.querySelector(`.pdf-page[data-page="${target}"]`);
    if (el && opts.scroll !== false) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (target !== currentPageNum || opts.force) openPageThread(target);
    updateProgress();
  }

  function updateProgress() {
    if (els.progress) els.progress.textContent = totalPages ? `página ${currentPageNum} de ${totalPages}` : '— / —';
    if (els.prev) els.prev.disabled = currentPageNum <= 1;
    if (els.next) els.next.disabled = currentPageNum >= totalPages;
  }

  function setupObserver() {
    let best = { ratio: 0, page: currentPageNum };
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const n = Number(entry.target.dataset.page);
          if (entry.isIntersecting && entry.intersectionRatio > best.ratio) best = { ratio: entry.intersectionRatio, page: n };
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
    if (els.pageLabel) els.pageLabel.textContent = `· página ${pageNum}`;
    if (unsub) unsub();
    const threadId = makeThreadId(book, docId, pageNum);
    unsub = await subscribeToThread(threadId, (items) => {
      currentComments = items;
      renderPanel();
    });
  }

  function renderPanel() {
    if (els.count) els.count.textContent = currentComments.length;
    if (!els.list) return;
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
    if (!els.commentText.value.trim()) return;
    els.commentSubmit.disabled = true;
    try {
      const threadId = makeThreadId(book, docId, currentPageNum);
      await postComment(threadId, {
        text: els.commentText.value,
        authorName: els.commentName.value,
        extra: { book, docId, pageIndex: currentPageNum },
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

  const onPrev = () => goToPage(currentPageNum - 1);
  const onNext = () => goToPage(currentPageNum + 1);
  const onZoomOut = () => setZoom(zoomLevel / ZOOM_STEP);
  const onZoomIn = () => setZoom(zoomLevel * ZOOM_STEP);
  const onTabClick = () => togglePanel();
  const onPanelClose = () => togglePanel(false);

  els.prev.addEventListener('click', onPrev);
  els.next.addEventListener('click', onNext);
  els.zoomOut.addEventListener('click', onZoomOut);
  els.zoomIn.addEventListener('click', onZoomIn);
  els.tab.addEventListener('click', onTabClick);
  els.panelClose.addEventListener('click', onPanelClose);
  els.commentSubmit.addEventListener('click', submitComment);

  setupObserver();
  goToPage(1, { scroll: false, force: true });
  updateProgress();

  return function destroy() {
    if (observer) observer.disconnect();
    if (unsub) unsub();
    els.prev.removeEventListener('click', onPrev);
    els.next.removeEventListener('click', onNext);
    els.zoomOut.removeEventListener('click', onZoomOut);
    els.zoomIn.removeEventListener('click', onZoomIn);
    els.tab.removeEventListener('click', onTabClick);
    els.panelClose.removeEventListener('click', onPanelClose);
    els.commentSubmit.removeEventListener('click', submitComment);
    togglePanel(false);
  };
}
