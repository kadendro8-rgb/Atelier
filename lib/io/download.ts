/**
 * Tiny, keyless browser download helper shared by the export buttons in the
 * packaging stage. Wraps the object-URL anchor-click dance once so each
 * exporter does not re-implement it. Best-effort: a locked-down browser
 * simply produces no file rather than throwing.
 */

/** Trigger a browser download of `data` as a file named `filename`. */
export function downloadBlob(
  data: Blob | string,
  filename: string,
  mime: string,
): void {
  const blob =
    typeof data === "string" ? new Blob([data], { type: mime }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke after a tick so the download has time to claim the URL.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
