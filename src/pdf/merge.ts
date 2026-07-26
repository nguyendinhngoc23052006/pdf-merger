import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { PdfFile } from '../types';

export type MergeOptions = {
  cover?: { title: string; subtitle: string } | null;
};

export async function mergePdfs(
  files: PdfFile[],
  opts: MergeOptions = {},
): Promise<Uint8Array> {
  const out = await PDFDocument.create();

  if (opts.cover) {
    await addCoverPage(out, opts.cover.title, opts.cover.subtitle);
  }

  for (const file of files) {
    const src = await PDFDocument.load(file.parsed.bytes, {
      ignoreEncryption: true,
    });
    const indices = pageIndicesFor(file, src.getPageCount());
    const copied = await out.copyPages(src, indices);
    for (const p of copied) out.addPage(p);
  }

  return out.save();
}

function pageIndicesFor(file: PdfFile, total: number): number[] {
  if (!file.range || !file.range.trim()) {
    return Array.from({ length: total }, (_, i) => i);
  }
  return parsePageRange(file.range, total);
}

export function parsePageRange(spec: string, total: number): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  const parts = spec.split(',').map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    const m = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const a = clamp(parseInt(m[1], 10), 1, total);
      const b = clamp(parseInt(m[2], 10), 1, total);
      const [lo, hi] = a <= b ? [a, b] : [b, a];
      for (let n = lo; n <= hi; n++) {
        if (!seen.has(n)) {
          seen.add(n);
          out.push(n - 1);
        }
      }
      continue;
    }
    const single = part.match(/^(\d+)$/);
    if (single) {
      const n = clamp(parseInt(single[1], 10), 1, total);
      if (!seen.has(n)) {
        seen.add(n);
        out.push(n - 1);
      }
      continue;
    }
    throw new Error(`Bad range fragment: "${part}"`);
  }

  if (out.length === 0) throw new Error('Range resolves to no pages');
  return out;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

async function addCoverPage(
  doc: PDFDocument,
  title: string,
  subtitle: string,
): Promise<void> {
  const page = doc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const italic = await doc.embedFont(StandardFonts.TimesRomanItalic);

  const ink = rgb(0.09, 0.08, 0.07);
  const amber = rgb(0.83, 0.65, 0.45);
  const dim = rgb(0.45, 0.4, 0.32);

  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.97, 0.94, 0.87),
  });

  page.drawLine({
    start: { x: 72, y: height - 120 },
    end: { x: 140, y: height - 120 },
    thickness: 2,
    color: amber,
  });

  const trimmedTitle = title.trim() || 'Untitled';
  const titleSize = pickTitleSize(trimmedTitle, serif, width - 144);
  const titleWidth = serif.widthOfTextAtSize(trimmedTitle, titleSize);

  page.drawText(trimmedTitle, {
    x: (width - titleWidth) / 2,
    y: height / 2 + 20,
    size: titleSize,
    font: serif,
    color: ink,
  });

  if (subtitle.trim()) {
    const subSize = 16;
    const subWidth = italic.widthOfTextAtSize(subtitle.trim(), subSize);
    page.drawText(subtitle.trim(), {
      x: (width - subWidth) / 2,
      y: height / 2 - 20,
      size: subSize,
      font: italic,
      color: dim,
    });
  }

  const stamp = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const stampSize = 10;
  const stampWidth = serif.widthOfTextAtSize(stamp, stampSize);
  page.drawText(stamp, {
    x: (width - stampWidth) / 2,
    y: 72,
    size: stampSize,
    font: serif,
    color: dim,
  });
}

function pickTitleSize(text: string, font: any, maxWidth: number): number {
  for (const size of [48, 40, 34, 28, 22, 18]) {
    if (font.widthOfTextAtSize(text, size) <= maxWidth) return size;
  }
  return 16;
}
