import { PDFDocument } from 'pdf-lib';
import { pdfjs } from './pdfjs-setup';

export type ParsedPdf = {
  bytes: Uint8Array;
  pageCount: number;
  thumbnail: string;
};

export async function parsePdf(file: File): Promise<ParsedPdf> {
  const buf = new Uint8Array(await file.arrayBuffer());

  const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
  const pageCount = doc.getPageCount();

  const thumbnail = await renderThumbnail(buf);

  return { bytes: buf, pageCount, thumbnail };
}

async function renderThumbnail(bytes: Uint8Array): Promise<string> {
  const loadingTask = pdfjs.getDocument({ data: bytes.slice() });
  const pdf = await loadingTask.promise;
  try {
    const page = await pdf.getPage(1);
    const targetWidth = 120;
    const viewport1 = page.getViewport({ scale: 1 });
    const scale = targetWidth / viewport1.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas 2d context unavailable');

    await page.render({ canvasContext: ctx, viewport } as any).promise;
    return canvas.toDataURL('image/png');
  } finally {
    await pdf.destroy();
  }
}
