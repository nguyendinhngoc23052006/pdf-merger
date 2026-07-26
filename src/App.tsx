import { useCallback, useMemo, useState } from 'preact/hooks';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { DropZone } from './components/DropZone';
import { FileCard } from './components/FileCard';
import { CoverPanel } from './components/CoverPanel';
import { parsePdf } from './pdf/parse';
import { mergePdfs, parsePageRange } from './pdf/merge';
import { formatBytes, makeId } from './util/format';
import type { PdfFile } from './types';

type Status =
  | { kind: 'idle' }
  | { kind: 'parsing' }
  | { kind: 'merging' }
  | { kind: 'done'; name: string }
  | { kind: 'error'; message: string };

const GITHUB_URL =
  'https://github.com/nguyendinhngoc23052006/pdf-merger';

export function App() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [coverOn, setCoverOn] = useState(false);
  const [coverTitle, setCoverTitle] = useState('');
  const [coverSub, setCoverSub] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const addFiles = useCallback(async (incoming: File[]) => {
    setStatus({ kind: 'parsing' });
    try {
      const parsed: PdfFile[] = [];
      for (const f of incoming) {
        const p = await parsePdf(f);
        parsed.push({
          id: makeId(),
          name: f.name,
          size: f.size,
          parsed: p,
          range: '',
          rangeError: null,
        });
      }
      setFiles((prev) => [...prev, ...parsed]);
      setStatus({ kind: 'idle' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus({
        kind: 'error',
        message: `Couldn't read a PDF: ${msg}`,
      });
    }
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
    setStatus({ kind: 'idle' });
  }, []);

  const setRange = useCallback((id: string, range: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        let err: string | null = null;
        if (range.trim()) {
          try {
            parsePageRange(range, f.parsed.pageCount);
          } catch (e) {
            err = e instanceof Error ? e.message : 'Invalid range';
          }
        }
        return { ...f, range, rangeError: err };
      }),
    );
  }, []);

  const onDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setFiles((prev) => {
      const oldIndex = prev.findIndex((f) => f.id === active.id);
      const newIndex = prev.findIndex((f) => f.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  const totals = useMemo(() => {
    const pages = files.reduce((sum, f) => {
      if (!f.range) return sum + f.parsed.pageCount;
      try {
        return sum + parsePageRange(f.range, f.parsed.pageCount).length;
      } catch {
        return sum;
      }
    }, 0);
    const bytes = files.reduce((sum, f) => sum + f.size, 0);
    return { pages, bytes, count: files.length };
  }, [files]);

  const anyRangeErrors = files.some((f) => !!f.rangeError);
  const canMerge =
    files.length >= 1 && !anyRangeErrors && status.kind !== 'merging';

  const doMerge = async () => {
    if (!canMerge) return;
    setStatus({ kind: 'merging' });
    try {
      const bytes = await mergePdfs(files, {
        cover: coverOn
          ? { title: coverTitle, subtitle: coverSub }
          : null,
      });
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus({ kind: 'done', name: 'merged.pdf' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus({ kind: 'error', message: `Merge failed: ${msg}` });
    }
  };

  return (
    <div class="wrap">
      <header class="masthead">
        <div class="brand">
          Fold<span class="dot">.</span>
        </div>
        <div class="masthead-meta">
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            source ↗
          </a>
        </div>
      </header>

      <section class="hero">
        <h1>
          Merge PDFs <em>in your browser.</em>
        </h1>
        <p>
          Your PDFs never touch a server. Combining, reordering, and page
          selection all happen on this page — no upload, no account, no
          tracking. Close the tab and every byte is gone.
        </p>
        <div class="privacy-badges">
          <span class="badge">No server</span>
          <span class="badge">No account</span>
          <span class="badge">No tracking</span>
          <span class="badge">Strict CSP: connect-src 'none'</span>
        </div>
      </section>

      <DropZone onFiles={addFiles} busy={status.kind === 'parsing'} />

      {files.length > 0 && (
        <section class="file-section">
          <div class="file-section-header">
            <h2>Your stack ({files.length})</h2>
            <div class="totals">
              {totals.pages} page{totals.pages === 1 ? '' : 's'} ·{' '}
              {formatBytes(totals.bytes)}
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={files.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul class="file-list">
                {files.map((f) => (
                  <FileCard
                    key={f.id}
                    file={f}
                    onRemove={removeFile}
                    onRangeChange={setRange}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>

          {files.length > 20 && (
            <div class="callout warn">
              You have more than 20 PDFs loaded. Browser memory limits can bite
              on very large stacks — if merging fails or the tab hangs, split
              into two batches and merge the results.
            </div>
          )}

          <CoverPanel
            enabled={coverOn}
            title={coverTitle}
            subtitle={coverSub}
            onToggle={setCoverOn}
            onTitle={setCoverTitle}
            onSubtitle={setCoverSub}
          />

          <div class="actions-bar">
            <button
              class="btn btn-primary"
              onClick={doMerge}
              disabled={!canMerge}
            >
              {status.kind === 'merging' ? (
                <>
                  <span class="spinner" /> Merging…
                </>
              ) : (
                <>Merge PDFs</>
              )}
            </button>
            <button class="btn btn-ghost" onClick={clearAll}>
              Clear all
            </button>
            <div class={`status ${statusClass(status)}`}>
              {statusText(status)}
            </div>
          </div>
        </section>
      )}

      <footer class="footer">
        <div>
          Built by <a href="https://github.com/nguyendinhngoc23052006">Ngoc</a>{' '}
          · Runs entirely in your browser
        </div>
        <div>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            source on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

function statusText(s: Status): string {
  switch (s.kind) {
    case 'idle':
      return '';
    case 'parsing':
      return 'Reading…';
    case 'merging':
      return '';
    case 'done':
      return `Downloaded ${s.name}`;
    case 'error':
      return s.message;
  }
}

function statusClass(s: Status): string {
  if (s.kind === 'done') return 'success';
  if (s.kind === 'error') return 'error';
  return '';
}
