/**
 * Escapes untrusted text before interpolating into HTML export/print templates.
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Populates a newly opened print window without interpolating untrusted strings
 * into document.write() or embedding inline <script> tags.
 */
export function renderSafePrintDocument(printWindow, { title, styles, bodyHtml, printDelayMs = 300 }) {
  if (!printWindow || !printWindow.document) return;
  const doc = printWindow.document;

  if (!doc.head || !doc.body) {
    doc.open();
    doc.write("<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head><body></body></html>");
    doc.close();
  }

  doc.title = String(title || "Statement");
  const styleEl = doc.createElement("style");
  styleEl.textContent = styles || "";
  doc.head.replaceChildren(styleEl);
  doc.body.innerHTML = bodyHtml || "";

  try {
    printWindow.opener = null;
  } catch (_) {
    // Ignore read-only opener in locked-down environments
  }

  setTimeout(() => {
    try {
      printWindow.focus();
      printWindow.print();
    } catch (_) {
      // Ignore print cancellation in headless/test environments
    }
  }, printDelayMs);
}

/**
 * Safely renders a pre-escaped HTML document string into a print popup
 * using DOMParser (no document.write, strips <script> elements).
 */
export function renderSafePrintHtml(printWindow, htmlString, printDelayMs = 300) {
  if (!printWindow || !printWindow.document) return;
  const parsed = new DOMParser().parseFromString(String(htmlString || ""), "text/html");
  parsed.querySelectorAll("script").forEach((el) => el.remove());
  const styles = Array.from(parsed.querySelectorAll("style"))
    .map((s) => s.textContent || "")
    .join("\n");
  renderSafePrintDocument(printWindow, {
    title: parsed.title || "Statement",
    styles,
    bodyHtml: parsed.body ? parsed.body.innerHTML : "",
    printDelayMs,
  });
}
