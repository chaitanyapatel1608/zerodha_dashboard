/**
 * Funds & Treasury Ledger Statement Exporter
 * Supports CSV, Excel (.xls), and Printable PDF Statement
 */

export const exportFundsToCSV = (transactions = [], funds = {}, currentUser = {}) => {
  const userId = currentUser?.userId || "TRADER";
  const today = new Date().toISOString().split("T")[0];
  const filename = `Zerodha_Funds_Ledger_${userId}_${today}.csv`;

  const headers = [
    "Date & Time",
    "Reference ID",
    "Type",
    "Amount (INR)",
    "Payment Mode",
    "Account / UPI",
    "Status",
    "Remarks",
  ];

  const rows = transactions.map((t) => [
    `"${new Date(t.createdAt).toLocaleString("en-IN")}"`,
    `"${t.referenceId}"`,
    `"${t.type}"`,
    Number(t.amount || 0).toFixed(2),
    `"${t.paymentMethod || "UPI"}"`,
    `"${t.upiId || t.bankAccount || "-"}"`,
    `"${t.status}"`,
    `"${(t.remarks || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportFundsToExcel = (transactions = [], funds = {}, currentUser = {}) => {
  const userId = currentUser?.userId || "TRADER";
  const userName = currentUser?.fullName || currentUser?.name || "Client";
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const filename = `Zerodha_Funds_Ledger_${userId}_${new Date().toISOString().split("T")[0]}.xls`;

  const equity = funds?.equity || {};

  const tableRows = transactions
    .map(
      (t) => `
      <tr>
        <td>${new Date(t.createdAt).toLocaleString("en-IN")}</td>
        <td>${t.referenceId}</td>
        <td><strong>${t.type}</strong></td>
        <td align="right">₹${Number(t.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        <td>${t.paymentMethod || "UPI"}</td>
        <td>${t.upiId || t.bankAccount || "-"}</td>
        <td>${t.status}</td>
        <td>${t.remarks || "-"}</td>
      </tr>
    `
    )
    .join("");

  const excelTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th { background: #387ed1; color: #ffffff; font-weight: bold; padding: 8px 10px; border: 1px solid #cbd5e1; }
        td { padding: 6px 10px; border: 1px solid #e2e8f0; font-size: 12px; }
        .header-title { font-size: 18px; font-weight: bold; color: #387ed1; margin-bottom: 4px; }
        .meta-text { font-size: 11px; color: #64748b; margin-bottom: 12px; }
      </style>
    </head>
    <body>
      <div class="header-title">ZERODHA BROKING LTD. &bull; FUNDS STATEMENT & LEDGER</div>
      <div class="meta-text">Client: ${userName} (${userId}) | Generated: ${today} | Available Margin: ₹${equity.availableMargin || "0.00"}</div>
      <table>
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>Reference ID</th>
            <th>Type</th>
            <th>Amount (INR)</th>
            <th>Mode</th>
            <th>Account / UPI</th>
            <th>Status</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows || '<tr><td colspan="8" align="center">No transactions recorded</td></tr>'}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([excelTemplate], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportFundsToPDF = (transactions = [], funds = {}, currentUser = {}) => {
  const userId = currentUser?.userId || "TRADER";
  const userName = currentUser?.fullName || currentUser?.name || "Client";
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const equity = funds?.equity || {};

  const rowsHtml = transactions
    .map(
      (t) => `
      <tr>
        <td>${new Date(t.createdAt).toLocaleString("en-IN")}</td>
        <td style="font-family: monospace;">${t.referenceId}</td>
        <td><strong>${t.type}</strong></td>
        <td style="text-align: right; font-weight: 600;">₹${Number(t.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        <td>${t.paymentMethod || "UPI"}</td>
        <td>${t.status === "COMPLETED" ? '<span style="color: #16a34a; font-weight: bold;">Completed</span>' : t.status}</td>
        <td>${t.remarks || "-"}</td>
      </tr>
    `
    )
    .join("");

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Zerodha Funds Statement - ${userId}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 30px; color: #0f172a; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #387ed1; padding-bottom: 16px; margin-bottom: 20px; }
        .brand { font-size: 24px; font-weight: 800; color: #387ed1; letter-spacing: 1px; }
        .sub { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; }
        .kpi-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; }
        .kpi-val { font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; }
        td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
        .footer { margin-top: 30px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">ZERODHA</div>
          <div class="sub">Official Trading Account Statement &bull; Funds Ledger</div>
        </div>
        <div style="text-align: right; font-size: 12px; color: #475569;">
          <div><strong>Client:</strong> ${userName} (${userId})</div>
          <div><strong>Statement Date:</strong> ${today}</div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Available Margin</div>
          <div class="kpi-val" style="color: #2563eb;">₹${equity.availableMargin || "0.00"}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Used Margin</div>
          <div class="kpi-val">₹${equity.usedMargin || "0.00"}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Available Cash</div>
          <div class="kpi-val">₹${equity.availableCash || "0.00"}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Total Collateral</div>
          <div class="kpi-val" style="color: #16a34a;">₹${equity.totalCollateral || "0.00"}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>Reference ID</th>
            <th>Type</th>
            <th style="text-align: right;">Amount (INR)</th>
            <th>Mode</th>
            <th>Status</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="7" align="center">No transactions recorded</td></tr>'}
        </tbody>
      </table>

      <div class="footer">
        Zerodha Broking Limited &bull; Member: NSE / BSE / MCX &bull; SEBI Reg: INZ000031633<br>
        This is a computer-generated account statement and does not require a physical signature.
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
};
