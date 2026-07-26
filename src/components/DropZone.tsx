import { useCallback, useRef, useState } from 'preact/hooks';

type Props = {
  onFiles: (files: File[]) => void;
  busy?: boolean;
};

export function DropZone({ onFiles, busy }: Props) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      const all = Array.from(list);
      const pdfs = all.filter(
        (f) =>
          f.type === 'application/pdf' ||
          f.name.toLowerCase().endsWith('.pdf'),
      );
      const rejected = all.length - pdfs.length;
      if (rejected > 0) {
        setError(
          `${rejected} file${rejected === 1 ? '' : 's'} skipped — only PDFs are accepted.`,
        );
      } else {
        setError(null);
      }
      if (pdfs.length > 0) onFiles(pdfs);
    },
    [onFiles],
  );

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer?.files ?? null);
  };

  return (
    <div>
      <div
        class={`dropzone ${dragging ? 'dragging' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-label="Drop PDFs here or click to browse"
      >
        <svg
          class="dropzone-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path
            d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <div class="dropzone-title">
          {busy ? 'Reading files…' : 'Drop PDFs here'}
        </div>
        <div class="dropzone-sub">
          or click to browse — files stay on your device
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          onChange={(e) => {
            const t = e.currentTarget as HTMLInputElement;
            handleFiles(t.files);
            t.value = '';
          }}
        />
      </div>
      {error && <div class="error-line">{error}</div>}
    </div>
  );
}
