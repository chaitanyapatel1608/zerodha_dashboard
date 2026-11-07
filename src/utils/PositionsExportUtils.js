/**
 * Professional Day Positions Statement Exporter
 * Supports CSV, Excel (.xls), and Printable PDF Statement
 */

export const exportPositionsToCSV = (positions, currentUser, quotes = {}) => {
  const userId = currentUser?.userId || "TRADER";
  const today = new Date().toISOString().split("T")[0];
  const filename = `Zerodha_Day_Positions_${userId}_${today}.csv`;

  const headers = [
    "Product",
    "Instrument",
    "Net Quantity",
    "Avg. Buy/Sell Price (INR)",
    "LTP (INR)",
    "P&L (INR)",
    "Net Change (%)",
    "Status",
  ];

  const rows = positions.map((p) => {
    const sym = (p.instrument || p.name || "").toUpperCase();
    const live = quotes[sym];
    const avg = Number(p.avg || p.price || 0);
    const qty = Number(p.qty || 0);
    const ltp = live ? live.price : Number(p.ltp || p.price || avg);
    const pnl = qty === 0 ? Number(p.realizedPnl || p.pnl || 0) : (qty > 0 ? (ltp - avg) * qty : (avg - ltp) * Math.abs(qty));
    const chg = p.chg || p.net || "0.00%";
    const status = qty === 0 ? "CLOSED" : "OPEN";

    return [
      `"${p.product || "MIS"}"`,
      `"${sym}"`,
      qty,
      avg.toFixed(2),
      ltp.toFixed(2),
      (pnl >= 0 ? "+" : "") + pnl.toFixed(2),
      `"${chg}"`,
      status,
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportPositionsToExcel = (positions, currentUser, quotes = {}) => {
  const userId = currentUser?.userId || "TRADER";
  const userName = currentUser?.name || "Client";
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const filename = `Zerodha_Day_Positions_${userId}_${new Date().toISOString().split("T")[0]}.xls`;

  let totalDayPnl = 0;

  const tableRows = positions
    .map((p) => {
      const sym = (p.instrument || p.name || "").toUpperCase();
      const live = quotes[sym];
      const avg = Number(p.avg || p.price || 0);
      const qty = Number(p.qty || 0);
      const ltp = live ? live.price : Number(p.ltp || p.price || avg);
      const pnl = qty === 0 ? Number(p.realizedPnl || p.pnl || 0) : (qty > 0 ? (ltp - avg) * qty : (avg - ltp) * Math.abs(qty));
      totalDayPnl += pnl;

      const pnlColor = pnl >= 0 ? "#10b981" : "#ef4444";
      const statusText = qty === 0 ? "CLOSED" : "OPEN";

      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${p.product || "MIS"}</td>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${sym}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${qty > 0 ? `+${qty}` : qty}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${avg.toFixed(2)}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${ltp.toFixed(2)}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: ${pnlColor}; font-weight: bold;">
            ${pnl >= 0 ? "+" : ""}₹${pnl.toFixed(2)}
          </td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${statusText}</td>
        </tr>
      `;
    })
    .join("");

  const excelTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Day Positions</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
    </head>
    <body style="font-family: Arial, sans-serif;">
      <h2 style="color: #387ed1; margin-bottom: 4px;">ZERODHA BROKING LTD. - DAY POSITIONS STATEMENT</h2>
      <p style="font-size: 13px; color: #555; margin-top: 0;">
        <strong>Client:</strong> ${userName} (${userId}) | <strong>Date:</strong> ${today}
      </p>
      <table style="border-collapse: collapse; width: 100%; font-size: 13px;">
        <thead>
          <tr style="background-color: #f4f6f8; text-align: left;">
            <th style="padding: 10px; border: 1px solid #ddd;">Product</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Instrument</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Qty</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Avg Price</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">LTP</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Day P&L (INR)</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
        <tfoot>
          <tr style="background-color: #f8fafc; font-weight: bold;">
            <td colspan="5" style="padding: 10px; border: 1px solid #ddd; text-align: right;">Total Day P&L:</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right; color: ${totalDayPnl >= 0 ? "#10b981" : "#ef4444"};">
              ${totalDayPnl >= 0 ? "+" : ""}₹${totalDayPnl.toFixed(2)}
            </td>
            <td style="border: 1px solid #ddd;"></td>
          </tr>
        </tfoot>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([excelTemplate], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportPositionsToPDF = (positions, currentUser, quotes = {}) => {
  const userId = currentUser?.userId || "TRADER";
  const userName = currentUser?.name || "Client";
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  let totalDayPnl = 0;

  const rowsHtml = positions
    .map((p) => {
      const sym = (p.instrument || p.name || "").toUpperCase();
      const live = quotes[sym];
      const avg = Number(p.avg || p.price || 0);
      const qty = Number(p.qty || 0);
      const ltp = live ? live.price : Number(p.ltp || p.price || avg);
      const pnl = qty === 0 ? Number(p.realizedPnl || p.pnl || 0) : (qty > 0 ? (ltp - avg) * qty : (avg - ltp) * Math.abs(qty));
      totalDayPnl += pnl;

      const pnlColor = pnl >= 0 ? "#10b981" : "#ef4444";
      const statusText = qty === 0 ? "CLOSED" : "OPEN";

      return `
        <tr>
          <td class="font-bold">${sym}</td>
          <td><span class="badge">${p.product || "MIS"}</span></td>
          <td class="text-right ${qty >= 0 ? "text-green" : "text-amber"}">${qty > 0 ? `+${qty}` : qty}</td>
          <td class="text-right">₹${avg.toFixed(2)}</td>
          <td class="text-right">₹${ltp.toFixed(2)}</td>
          <td class="text-right font-bold" style="color: ${pnlColor};">
            ${pnl >= 0 ? "+" : ""}₹${pnl.toFixed(2)}
          </td>
          <td class="text-center">${statusText}</td>
        </tr>
      `;
    })
    .join("");

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to print your positions statement.");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Day Positions Statement - ${userId} - ${today}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 32px; margin: 0; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #387ed1; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 22px; font-weight: 700; color: #387ed1; margin: 0; }
          .meta { font-size: 13px; color: #64748b; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 16px; }
          th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 11px; text-transform: uppercase; color: #475569; }
          td { border: 1px solid #e2e8f0; padding: 8px 10px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .font-bold { font-weight: 700; }
          .badge { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; }
          .footer-summary { display: flex; justify-content: flex-end; margin-top: 16px; font-size: 14px; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">ZERODHA DAY POSITIONS STATEMENT</h1>
            <div class="meta">Client: ${userName} (${userId}) | Date: ${today}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Instrument</th>
              <th>Product</th>
              <th class="text-right">Net Qty</th>
              <th class="text-right">Avg Price</th>
              <th class="text-right">LTP</th>
              <th class="text-right">Day P&L</th>
              <th class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="footer-summary">
          Total Day P&L: <span style="color: ${totalDayPnl >= 0 ? "#10b981" : "#ef4444"}; margin-left: 8px;">
            ${totalDayPnl >= 0 ? "+" : ""}₹${totalDayPnl.toFixed(2)}
          </span>
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
