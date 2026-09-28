// =====================================================================
// Renderiza as páginas de um PDF como imagens (data URLs).
// Compartilhado pelo leitor de rolagem (livro/cadernos) e pela galeria
// de ilustrações — a única parte que muda entre eles é a apresentação.
// =====================================================================

let workerConfigured = false;

function ensureWorker() {
  if (workerConfigured) return;
  // eslint-disable-next-line no-undef
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/vendor/pdfjs/pdf.worker.min.js';
  workerConfigured = true;
}

/**
 * @param {string} url - caminho do arquivo PDF
 * @param {number} renderWidth - largura-base do render, em pixels (mais alto = mais nítido no zoom)
 * @param {(done:number, total:number) => void} [onProgress]
 * @returns {Promise<string[]>} uma data URL (JPEG) por página, em ordem
 */
export async function renderPdfPages(url, renderWidth, onProgress) {
  ensureWorker();
  // eslint-disable-next-line no-undef
  const pdf = await pdfjsLib.getDocument(url).promise;
  const images = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    // eslint-disable-next-line no-await-in-loop
    const page = await pdf.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const scale = renderWidth / base.width;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    // eslint-disable-next-line no-await-in-loop
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    images.push(canvas.toDataURL('image/jpeg', 0.86));
    if (onProgress) onProgress(n, pdf.numPages);
  }
  return images;
}
