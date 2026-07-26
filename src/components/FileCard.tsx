import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PdfFile } from '../types';
import { formatBytes } from '../util/format';

type Props = {
  file: PdfFile;
  onRemove: (id: string) => void;
  onRangeChange: (id: string, range: string) => void;
};

export function FileCard({ file, onRemove, onRangeChange }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style: any = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      class={`file-card ${isDragging ? 'dragging' : ''}`}
    >
      <button
        class="drag-handle"
        aria-label={`Reorder ${file.name}`}
        {...(attributes as any)}
        {...(listeners as any)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="5" cy="3" r="1.4" />
          <circle cx="5" cy="8" r="1.4" />
          <circle cx="5" cy="13" r="1.4" />
          <circle cx="11" cy="3" r="1.4" />
          <circle cx="11" cy="8" r="1.4" />
          <circle cx="11" cy="13" r="1.4" />
        </svg>
      </button>

      <div class="thumb">
        {file.parsed.thumbnail ? (
          <img src={file.parsed.thumbnail} alt="" />
        ) : (
          <span class="thumb-placeholder">PDF</span>
        )}
      </div>

      <div class="file-meta">
        <div class="file-name" title={file.name}>
          {file.name}
        </div>
        <div class="file-sub">
          {file.parsed.pageCount} page
          {file.parsed.pageCount === 1 ? '' : 's'} · {formatBytes(file.size)}
        </div>
      </div>

      <div class="file-actions">
        <button
          class="icon-btn danger"
          aria-label={`Remove ${file.name}`}
          onClick={() => onRemove(file.id)}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path
              d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a1 1 0 01-1 1H7a1 1 0 01-1-1V6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>

      <div class="range-row">
        <label htmlFor={`range-${file.id}`}>Pages:</label>
        <input
          id={`range-${file.id}`}
          type="text"
          placeholder="all"
          value={file.range}
          onInput={(e) =>
            onRangeChange(file.id, (e.currentTarget as HTMLInputElement).value)
          }
          aria-label={`Page range for ${file.name}`}
        />
        <span style={{ color: 'var(--ink-dim)' }}>
          e.g. 1-3, 5, 8-10 · leave blank for all
        </span>
        {file.rangeError && <span class="range-err">{file.rangeError}</span>}
      </div>
    </li>
  );
}
