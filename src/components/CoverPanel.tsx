type Props = {
  enabled: boolean;
  title: string;
  subtitle: string;
  onToggle: (v: boolean) => void;
  onTitle: (v: string) => void;
  onSubtitle: (v: string) => void;
};

export function CoverPanel({
  enabled,
  title,
  subtitle,
  onToggle,
  onTitle,
  onSubtitle,
}: Props) {
  return (
    <div class="cover-panel">
      <label class="cover-panel-head">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) =>
            onToggle((e.currentTarget as HTMLInputElement).checked)
          }
        />
        <h3>Add a cover page</h3>
      </label>
      {enabled && (
        <div class="cover-fields">
          <div>
            <label htmlFor="cover-title">Title</label>
            <input
              id="cover-title"
              type="text"
              placeholder="Quarterly Report"
              value={title}
              onInput={(e) =>
                onTitle((e.currentTarget as HTMLInputElement).value)
              }
            />
          </div>
          <div>
            <label htmlFor="cover-sub">Subtitle</label>
            <input
              id="cover-sub"
              type="text"
              placeholder="Q3 2026 · Assembled from source documents"
              value={subtitle}
              onInput={(e) =>
                onSubtitle((e.currentTarget as HTMLInputElement).value)
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
