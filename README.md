# Fold — client-side PDF merger

Merge, reorder, and slice PDFs entirely in your browser. Files never touch a server.

- **No upload, no account, no tracking** — everything runs in the tab.
- **Strict CSP** with `connect-src 'none'`; open devtools to verify no outbound calls happen.
- **Warm dark editorial** UI matching the author's portfolio.

## Stack

- Vite 5 + Preact 10 + TypeScript (`preact/compat` alias so React-shaped libraries work)
- [`pdf-lib`](https://pdf-lib.js.org/) — parsing, merging, cover-page rendering
- [`pdfjs-dist`](https://mozilla.github.io/pdf.js/) — first-page thumbnail rendering (pdf-lib cannot rasterize)
- [`@dnd-kit`](https://dndkit.com/) — drag-to-reorder

## Develop

```
npm install
npm run dev
```

## Build

```
npm run build
npm run preview
```

Output lands in `dist/`.

## Deploy

Cloudflare Pages, native git integration:

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → select this repo
2. Framework preset: **Vite**
3. Build command: `npm run build`
4. Build output directory: `dist`
5. Deploy

No environment variables, no secrets, no CI required. Every push to `main` deploys.
