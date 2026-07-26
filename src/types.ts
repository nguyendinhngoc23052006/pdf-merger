import type { ParsedPdf } from './pdf/parse';

export type PdfFile = {
  id: string;
  name: string;
  size: number;
  parsed: ParsedPdf;
  range: string;
  rangeError?: string | null;
};
