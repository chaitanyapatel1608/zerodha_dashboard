import { describe, it, expect, vi, afterEach } from "vitest";
import { escapeHtml, renderSafePrintHtml } from "../utils/htmlSanitizer";
import { exportFundsToPDF } from "../utils/FundsExportUtils";
import { exportHoldingsToPDF } from "../utils/HoldingsExportUtils";
import { exportPositionsToPDF } from "../utils/PositionsExportUtils";
import { exportBidsToPDF } from "../utils/BidsExportUtils";

describe("Dashboard Print Export XSS & Sanitizer Suite", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("escapeHtml neutralizes tags, quotes, and event handler attributes", () => {
    const payload = `<script>alert(1)</script><img src=x onerror="alert('xss')">`;
    const escaped = escapeHtml(payload);
    expect(escaped).not.toContain("<script>");
    expect(escaped).not.toContain("<img");
    expect(escaped).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(escaped).toContain("&quot;alert(&#39;xss&#39;)&quot;");
  });

  it("renderSafePrintHtml strips script elements and never calls document.write on populated docs", () => {
    const popupDoc = document.implementation.createHTMLDocument("blank");
    const writeSpy = vi.spyOn(popupDoc, "write");
    const mockWin = { document: popupDoc, focus: vi.fn(), print: vi.fn() };

    renderSafePrintHtml(mockWin, "<title>Test</title><style>body{}</style><p>Safe</p><script>alert(1)</script>");
    expect(writeSpy).not.toHaveBeenCalled();
    expect(popupDoc.querySelectorAll("script").length).toBe(0);
    expect(popupDoc.body.textContent).toContain("Safe");
  });

  it("all 4 PDF export utilities escape malicious remarks, symbols, and user identifiers", () => {
    const popupDoc = document.implementation.createHTMLDocument("blank");
    const mockWin = { document: popupDoc, focus: vi.fn(), print: vi.fn() };
    vi.spyOn(window, "open").mockReturnValue(mockWin);

    const xssUser = {
      userId: `<script>alert(1)</script>`,
      fullName: `Trader" onmouseover="alert(2)`,
      name: `Trader" onmouseover="alert(2)`,
      demat: `<img src=x onerror=alert(3)>`,
    };

    exportFundsToPDF(
      [{ createdAt: new Date().toISOString(), referenceId: "REF1", type: "DEPOSIT", amount: 1000, status: "COMPLETED", remarks: `<img src=x onerror=alert(4)>` }],
      { equity: {} },
      xssUser
    );
    expect(popupDoc.querySelectorAll("script").length).toBe(0);
    expect(popupDoc.querySelectorAll("img").length).toBe(0);
    expect(popupDoc.body.textContent).toContain("<img src=x onerror=alert(4)>");

    exportHoldingsToPDF([{ instrument: `<svg onload=alert(5)>`, qty: 1, avg: 100, ltp: 110 }], xssUser);
    expect(popupDoc.querySelectorAll("svg").length).toBe(0);

    exportPositionsToPDF([{ instrument: `<iframe src=x>`, product: `MIS<script>`, qty: 1, avg: 100, ltp: 110 }], xssUser);
    expect(popupDoc.querySelectorAll("iframe").length).toBe(0);

    exportBidsToPDF([{ symbol: `<img src=x onerror=alert(6)>`, name: "Co", dates: "Today", priceRange: "100", minAmount: "1000", minQty: 10, status: "Open" }], [], xssUser);
    expect(popupDoc.querySelectorAll("img").length).toBe(0);
  });
});
