export function PreviewBanner() {
  const preview = new URLSearchParams(window.location.search).get('preview');
  if (!preview) return null;
  const short = preview.slice(0, 7);
  return (
    <div className="preview-banner" role="status">
      Preview build — not production (commit {short})
    </div>
  );
}
