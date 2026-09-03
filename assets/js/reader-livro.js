// =====================================================================
// LEITOR DO LIVRO PRINCIPAL
// Carrega capítulos em Markdown, pagina o texto e liga os comentários
// por trecho selecionado.
// =====================================================================
import { makeThreadId, subscribeToThread, postComment, formatTimestamp } from './comments.js';

const BOOK_ID = 'livro';
const PAGE_W = 420;
const PAGE_H = 600;

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
  popup: document.getElementById('comment-popup'),
  popupQuote: document.getElementById('popup-quote'),
  popupText: document.getElementById('popup-text'),
  popupName: document.getElementById('popup-name'),
  popupCancel: document.getElementById('popup-cancel'),
  popupSubmit: document.getElementById('popup-submit'),
};

let manifest = [];
let currentChapter = null;
let pageFlip = null;
let unsub = null;
let allComments = [];
let pendingSelection = null; // { blockId, start, end, quote }
let activeBlockId = null;
let bookOpened = false; // true depois da primeira página aberta nesta sessão
let lastMeta = null;
let lastPageGroups = null;
let resizeTimer = null;

async function init() {
  try {
    manifest = await (await fetch('chapters/manifest.json', { cache: 'no-store' })).json();
  } catch (e) {
    els.sub.textContent = 'não foi possível carregar chapters/manifest.json';
    console.error(e);
    return;
  }

  if (!manifest.length) {
    els.sub.textContent = 'nenhum capítulo cadastrado ainda';
    return;
  }

  els.select.innerHTML = manifest
    .map((c, i) => `<option value="${c.id}">${i + 1}. ${c.title}</option>`)
    .join('');

  const hashId = decodeURIComponent(location.hash.replace('#', ''));
  const start = manifest.find((c) => c.id === hashId) || manifest[0];
  els.select.value = start.id;

  els.select.addEventListener('change', () => loadChapter(els.select.value));
  els.prev.addEventListener('click', () => pageFlip && pageFlip.flipPrev());
  els.next.addEventListener('click', () => pageFlip && pageFlip.flipNext());
  els.tab.addEventListener('click', () => togglePanel());
  els.panelClose.addEventListener('click', () => togglePanel(false));
  document.addEventListener('mouseup', onSelectionMaybe);
  document.addEventListener('touchend', onSelectionMaybe);
  els.popupCancel.addEventListener('click', closePopup);
  els.popupSubmit.addEventListener('click', submitPopupComment);
  window.addEventListener('resize', onWindowResize);

  await loadChapter(start.id);
}

function onWindowResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (lastMeta && lastPageGroups) mountFlip(lastMeta, lastPageGroups, { showCover: false });
  }, 200);
}

async function loadChapter(chapterId) {
  const meta = manifest.find((c) => c.id === chapterId);
  if (!meta) return;
  currentChapter = meta;
  location.hash = encodeURIComponent(chapterId);
  els.select.value = chapterId;
  els.sub.textContent = 'carregando…';
  closePopup();

  let markdown = '';
  try {
    const res = await fetch(`chapters/${meta.file}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status);
    markdown = await res.text();
  } catch (e) {
    els.sub.textContent = `não foi possível carregar chapters/${meta.file}`;
    console.error(e);
    return;
  }

  const blocks = markdownToBlocks(markdown, chapterId);
  const pageGroups = paginateBlocks(blocks, PAGE_W, PAGE_H);
  lastMeta = meta;
  lastPageGroups = pageGroups;
  const showCover = !bookOpened;
  bookOpened = true;
  allComments = [];
  activeBlockId = null;

  mountFlip(meta, pageGroups, { showCover });

  els.sub.textContent = `${meta.title} · ${pageGroups.length} página${pageGroups.length === 1 ? '' : 's'}`;

  await subscribeChapterComments(chapterId);
}

// ---------------------------------------------------------------------
// Monta (ou remonta, ao redimensionar) o livro dentro do espaço disponível,
// sempre mostrando uma página por vez, como um livro de verdade.
// ---------------------------------------------------------------------
function mountFlip(meta, pageGroups, opts = {}) {
  const pageElements = buildPageElements(meta, pageGroups, opts);
  const size = computeSinglePageSize();

  if (pageFlip) {
    pageFlip.destroy();
    els.flip.innerHTML = '';
  }
  els.flip.style.width = `${size.width}px`;
  els.flip.style.height = `${size.height}px`;

  // eslint-disable-next-line no-undef
  pageFlip = new St.PageFlip(els.flip, {
    width: PAGE_W,
    height: PAGE_H,
    size: 'stretch',
    autoSize: false,
    minWidth: size.width,
    maxWidth: size.width,
    minHeight: size.height,
    maxHeight: size.height,
    showCover: true,
    usePortrait: true,
    maxShadowOpacity: 0.5,
    mobileScrollSupport: false,
  });
  pageFlip.loadFromHTML(pageElements);
  pageFlip.on('flip', updateProgress);
  updateProgress();
  renderHighlights();
}

function updateProgress() {
  if (!pageFlip) return;
  const cur = pageFlip.getCurrentPageIndex() + 1;
  const total = pageFlip.getPageCount();
  els.progress.textContent = `${cur} / ${total}`;
  els.prev.disabled = cur <= 1;
  els.next.disabled = cur >= total;
}

// ---------------------------------------------------------------------
// Calcula o tamanho de UMA página só, do maior jeito possível sem
// estourar o espaço visível do navegador (sem gerar rolagem).
// ---------------------------------------------------------------------
function computeSinglePageSize() {
  const topbar = document.querySelector('.reader-topbar');
  const controls = document.querySelector('.reader-controls');
  const chrome = (topbar ? topbar.offsetHeight : 0) + (controls ? controls.offsetHeight : 0);
  const vh = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
  const vw = (window.visualViewport && window.visualViewport.width) || window.innerWidth;
  const availH = Math.max(280, vh - chrome - 24);
  const availW = Math.max(220, vw - 32);

  const ratio = PAGE_W / PAGE_H;
  let w = Math.min(availW, 520); // teto de conforto de leitura numa tela bem larga
  let h = w / ratio;
  if (h > availH) {
    h = availH;
    w = h * ratio;
  }
  return { width: Math.floor(w), height: Math.floor(h) };
}

// ---------------------------------------------------------------------
// Markdown → blocos endereçáveis (cada bloco tem um id estável)
// ---------------------------------------------------------------------
function markdownToBlocks(markdown, chapterId) {
  const tokens = marked.lexer(markdown);
  return tokens.map((token, i) => ({
    id: `${chapterId}:${i}`,
    html: marked.parser([token]),
  }));
}

// ---------------------------------------------------------------------
// Paginação: mede blocos num container invisível idêntico ao real
// ---------------------------------------------------------------------
function paginateBlocks(blocks, widthPx, heightPx) {
  const probe = document.createElement('div');
  probe.className = 'page-inner';
  probe.style.cssText = `position:fixed; visibility:hidden; pointer-events:none; width:${widthPx}px; height:auto; top:-9999px; left:-9999px;`;
  document.body.appendChild(probe);

  const pages = [];
  let current = [];
  for (const block of blocks) {
    current.push(block);
    probe.innerHTML = current.map((b) => `<div data-block-id="${b.id}">${b.html}</div>`).join('');
    if (probe.scrollHeight > heightPx - 24 && current.length > 1) {
      current.pop();
      pages.push(current);
      current = [block];
    }
  }
  if (current.length) pages.push(current);
  probe.remove();
  return pages.length ? pages : [[]];
}

// ---------------------------------------------------------------------
// Monta os elementos <div class="page"> que o PageFlip vai usar
// ---------------------------------------------------------------------
function buildPageElements(meta, pageGroups, opts = {}) {
  const els_ = [];

  if (opts.showCover) {
    const bookCover = document.createElement('div');
    bookCover.className = 'page';
    bookCover.style.background = '#fff';
    bookCover.innerHTML = `<img src="assets/img/capa-livro.jpg" alt="Capa de Cartas para Iam, de Alessandra Abreu" style="width:100%;height:100%;object-fit:cover;display:block;">`;
    els_.push(bookCover);
  }

  const cover = document.createElement('div');
  cover.className = 'page page-cover';
  cover.innerHTML = `
    <svg class="flourish" viewBox="0 0 64 18" aria-hidden="true"><path d="M2 9 C 16 -2, 24 20, 32 9 S 48 -2, 62 9"/></svg>
    <h2>${escapeHtml(meta.title)}</h2>
    <svg class="flourish" viewBox="0 0 64 18" aria-hidden="true" style="transform:scaleY(-1)"><path d="M2 9 C 16 -2, 24 20, 32 9 S 48 -2, 62 9"/></svg>
  `;
  els_.push(cover);

  pageGroups.forEach((group, i) => {
    const page = document.createElement('div');
    page.className = 'page';
    const inner = document.createElement('div');
    inner.className = 'page-inner';
    inner.innerHTML = group.map((b) => `<div data-block-id="${b.id}">${b.html}</div>`).join('');
    page.appendChild(inner);
    const num = document.createElement('div');
    num.className = 'page-number';
    num.textContent = `${i + 1}`;
    page.appendChild(num);
    els_.push(page);
  });

  return els_;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------------------------------------------------------------------
// Seleção de texto → popup de comentário
// ---------------------------------------------------------------------
function onSelectionMaybe(evt) {
  if (els.popup.contains(evt.target)) return;
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.toString().trim()) {
    return;
  }
  const range = sel.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const blockEl = (container.nodeType === 1 ? container : container.parentElement)?.closest('[data-block-id]');
  if (!blockEl) return;

  const quote = sel.toString().trim();
  if (quote.length < 2) return;

  const blockText = blockEl.textContent;
  const start = blockText.indexOf(quote);
  if (start === -1) return;

  pendingSelection = { blockId: blockEl.dataset.blockId, start, end: start + quote.length, quote };

  const rect = range.getBoundingClientRect();
  openPopup(rect);
}

function openPopup(rect) {
  els.popup.hidden = false;
  els.popupQuote.textContent = `"${pendingSelection.quote}"`;
  els.popupText.value = '';
  const top = window.scrollY + rect.bottom + 8;
  let left = window.scrollX + rect.left;
  const maxLeft = window.scrollX + document.documentElement.clientWidth - 280;
  left = Math.min(left, maxLeft);
  els.popup.style.top = `${top}px`;
  els.popup.style.left = `${Math.max(8, left)}px`;
  els.popupText.focus();
}

function closePopup() {
  els.popup.hidden = true;
  pendingSelection = null;
  window.getSelection()?.removeAllRanges();
}

async function submitPopupComment() {
  if (!pendingSelection || !els.popupText.value.trim()) return;
  els.popupSubmit.disabled = true;
  try {
    const threadId = makeThreadId(BOOK_ID, currentChapter.id);
    await postComment(threadId, {
      text: els.popupText.value,
      authorName: els.popupName.value,
      extra: {
        book: BOOK_ID,
        chapterId: currentChapter.id,
        blockId: pendingSelection.blockId,
        start: pendingSelection.start,
        end: pendingSelection.end,
        quote: pendingSelection.quote,
      },
    });
    closePopup();
  } catch (e) {
    if (e.message === 'firebase-not-configured') {
      alert('O banco de comentários ainda não foi configurado. Veja README.md → "Configurar o banco de comentários".');
    } else {
      alert('Não deu para salvar o comentário. Tente de novo em instantes.');
    }
    console.error(e);
  } finally {
    els.popupSubmit.disabled = false;
  }
}

// ---------------------------------------------------------------------
// Painel de margens (lista de comentários)
// ---------------------------------------------------------------------
async function subscribeChapterComments(chapterId) {
  if (unsub) unsub();
  const threadId = makeThreadId(BOOK_ID, chapterId);
  unsub = await subscribeToThread(threadId, (items) => {
    allComments = items;
    renderHighlights();
    renderPanel();
  });
}

function renderHighlights() {
  document.querySelectorAll('#book-flip mark.annot').forEach((m) => {
    const parent = m.parentNode;
    while (m.firstChild) parent.insertBefore(m.firstChild, m);
    parent.removeChild(m);
    parent.normalize();
  });

  const byBlock = {};
  for (const c of allComments) {
    if (!c.blockId) continue;
    (byBlock[c.blockId] = byBlock[c.blockId] || []).push(c);
  }

  for (const blockId in byBlock) {
    const blockEl = document.querySelector(`#book-flip [data-block-id="${cssEscape(blockId)}"]`);
    if (!blockEl) continue;
    const spans = byBlock[blockId].slice().sort((a, b) => a.start - b.start);
    for (const c of spans) {
      wrapRange(blockEl, c.start, c.end, c.blockId + ':' + c.start + ':' + c.end);
    }
  }

  document.querySelectorAll('#book-flip mark.annot').forEach((m) => {
    m.addEventListener('click', () => {
      activeBlockId = m.dataset.anchor;
      renderPanel();
      togglePanel(true);
    });
  });
}

function wrapRange(blockEl, start, end, anchorKey) {
  const walker = document.createTreeWalker(blockEl, NodeFilter.SHOW_TEXT);
  let pos = 0;
  let node;
  while ((node = walker.nextNode())) {
    const len = node.textContent.length;
    if (pos + len > start) {
      const localStart = Math.max(0, start - pos);
      const localEnd = Math.min(len, end - pos);
      if (localEnd > localStart) {
        const range = document.createRange();
        range.setStart(node, localStart);
        range.setEnd(node, localEnd);
        const mark = document.createElement('mark');
        mark.className = 'annot';
        mark.dataset.anchor = anchorKey;
        try {
          range.surroundContents(mark);
        } catch (e) { /* seleção cruza múltiplos nós — ignora silenciosamente */ }
      }
      if (end - pos <= len) break;
    }
    pos += len;
  }
}

function cssEscape(s) {
  return window.CSS && CSS.escape ? CSS.escape(s) : s.replace(/[:."]/g, '\\$&');
}

function renderPanel() {
  els.count.textContent = allComments.length;
  if (!allComments.length) {
    els.list.innerHTML = '<p class="marginalia-empty">Selecione um trecho do texto para começar um comentário, ou clique num trecho já sublinhado para ler o que outras pessoas escreveram.</p>';
    return;
  }
  const list = activeBlockId
    ? allComments.filter((c) => `${c.blockId}:${c.start}:${c.end}` === activeBlockId)
    : allComments;

  if (!list.length) {
    els.list.innerHTML = '<p class="marginalia-empty">Sem comentários nesse trecho ainda.</p>';
    return;
  }

  els.list.innerHTML = list
    .map(
      (c) => `
      <div class="note-card">
        <div class="note-quote">"${escapeHtml(c.quote || '')}"</div>
        <div class="note-body">${escapeHtml(c.text)}</div>
        <div class="note-meta">${escapeHtml(c.authorName || 'Anônimo')} · ${formatTimestamp(c.createdAt)}</div>
      </div>`
    )
    .join('');
}

function togglePanel(force) {
  const open = force ?? !els.panel.classList.contains('is-open');
  els.panel.classList.toggle('is-open', open);
  els.tab.setAttribute('aria-expanded', String(open));
  if (!open) {
    activeBlockId = null;
    renderPanel();
  }
}

init();
