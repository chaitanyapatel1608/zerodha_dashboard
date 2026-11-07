/**
 * Professional Demat Holdings Statement Exporter
 * Supports CSV, Excel (.xls), and Printable PDF Statement
 */

export const exportHoldingsToCSV = (holdings, currentUser, quotes = {}) => {
  const userId = currentUser?.userId || "TRADER";
  const today = new Date().toISOString().split("T")[0];
  const filename = `Zerodha_Holdings_Statement_${userId}_${today}.csv`;

  const headers = [
    "Instrument",
    "Quantity",
    "Average Cost (INR)",
    "LTP (INR)",
    "Current Value (INR)",
    "P&L (INR)",
    "Net Change (%)",
    "Day Change (%)",
  ];

  const rows = holdings.map((h) => {
    const sym = (h.instrument || h.name || "").toUpperCase();
    const live = quotes[sym];
    const avgCost = Number(h.avgCost || h.avg || 0);
    const qty = Number(h.qty || 0);
    const ltp = live ? live.price : Number(h.ltp || h.price || avgCost);
    const curVal = ltp * qty;
    const invested = avgCost * qty;
    const pnl = curVal - invested;
    const netChg = invested > 0 ? ((pnl / invested) * 100).toFixed(2) + "%" : "0.00%";
    const dayChg = live ? live.percent : (h.dayChg || "0.00%");

    return [
      `"${sym}"`,
      qty,
      avgCost.toFixed(2),
      ltp.toFixed(2),
      curVal.toFixed(2),
      (pnl >= 0 ? "+" : "") + pnl.toFixed(2),
      `"${netChg}"`,
      `"${dayChg}"`,
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

export const exportHoldingsToExcel = (holdings, currentUser, quotes = {}) => {
  const userId = currentUser?.userId || "TRADER";
  const userName = currentUser?.name || "Client";
  const demat = currentUser?.demat || "1208160012345678";
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const filename = `Zerodha_Holdings_Statement_${userId}_${new Date().toISOString().split("T")[0]}.xls`;

  let totalInvested = 0;
  let totalCurVal = 0;

  const tableRows = holdings
    .map((h) => {
      const sym = (h.instrument || h.name || "").toUpperCase();
      const live = quotes[sym];
      const avgCost = Number(h.avgCost || h.avg || 0);
      const qty = Number(h.qty || 0);
      const ltp = live ? live.price : Number(h.ltp || h.price || avgCost);
      const curVal = ltp * qty;
      const invested = avgCost * qty;
      const pnl = curVal - invested;
      const netChg = invested > 0 ? ((pnl / invested) * 100).toFixed(2) + "%" : "0.00%";
      const dayChg = live ? live.percent : (h.dayChg || "0.00%");

      totalInvested += invested;
      totalCurVal += curVal;

      const pnlColor = pnl >= 0 ? "#10b981" : "#ef4444";

      return `
        <tr>
          <td style="font-weight: bold; border: 1px solid #ddd; padding: 8px;">${sym}</td>
          <td style="text-align: right; border: 1px solid #ddd; padding: 8px;">${qty}</td>
          <td style="text-align: right; border: 1px solid #ddd; padding: 8px;">₹${avgCost.toFixed(2)}</td>
          <td style="text-align: right; border: 1px solid #ddd; padding: 8px;">₹${ltp.toFixed(2)}</td>
          <td style="text-align: right; border: 1px solid #ddd; padding: 8px; font-weight: bold;">₹${curVal.toFixed(2)}</td>
          <td style="text-align: right; border: 1px solid #ddd; padding: 8px; color: ${pnlColor}; font-weight: bold;">
            ${pnl >= 0 ? "+" : ""}₹${pnl.toFixed(2)}
          </td>
          <td style="text-align: right; border: 1px solid #ddd; padding: 8px; color: ${pnlColor};">${netChg}</td>
          <td style="text-align: right; border: 1px solid #ddd; padding: 8px;">${dayChg}</td>
        </tr>
      `;
    })
    .join("");

  const totalPnl = totalCurVal - totalInvested;
  const totalPnlPct = totalInvested > 0 ? ((totalPnl / totalInvested) * 100).toFixed(2) : "0.00";

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Holdings Statement</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
    </head>
    <body style="font-family: Arial, sans-serif;">
      <h2 style="color: #387ed1; margin-bottom: 4px;">ZERODHA BROKING LTD. - DEMAT HOLDINGS STATEMENT</h2>
      <p style="margin: 2px 0 14px 0; font-size: 13px; color: #555;">
        <strong>Client:</strong> ${userName} (${userId}) | <strong>Demat BO ID:</strong> ${demat} | <strong>Statement Date:</strong> ${today}
      </p>
      <table style="border-collapse: collapse; width: 100%; font-size: 13px;">
        <thead>
          <tr style="background-color: #f1f5f9; color: #1e293b;">
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Instrument</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Quantity</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Avg. Cost</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">LTP</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Current Value</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">P&L</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Net Chg.</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Day Chg.</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
        <tfoot>
          <tr style="background-color: #fafbfc; font-weight: bold; font-size: 14px;">
            <td style="border: 1px solid #ddd; padding: 10px;">Total Valuation</td>
            <td colspan="3" style="border: 1px solid #ddd; padding: 10px; text-align: right;">Total Invested: ₹${totalInvested.toFixed(2)}</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">₹${totalCurVal.toFixed(2)}</td>
            <td colspan="3" style="border: 1px solid #ddd; padding: 10px; text-align: right; color: ${totalPnl >= 0 ? "#10b981" : "#ef4444"};">
              Total P&L: ${totalPnl >= 0 ? "+" : ""}₹${totalPnl.toFixed(2)} (${totalPnl >= 0 ? "+" : ""}${totalPnlPct}%)
            </td>
          </tr>
        </tfoot>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([excelHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportHoldingsToPDF = (holdings, currentUser, quotes = {}) => {
  const userId = currentUser?.userId || "TRADER";
  const userName = currentUser?.name || "Client";
  const demat = currentUser?.demat || "1208160012345678";
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const time = new Date().toLocaleTimeString("en-IN");

  let totalInvested = 0;
  let totalCurVal = 0;

  const rowsHtml = holdings
    .map((h, idx) => {
      const sym = (h.instrument || h.name || "").toUpperCase();
      const live = quotes[sym];
      const avgCost = Number(h.avgCost || h.avg || 0);
      const qty = Number(h.qty || 0);
      const ltp = live ? live.price : Number(h.ltp || h.price || avgCost);
      const curVal = ltp * qty;
      const invested = avgCost * qty;
      const pnl = curVal - invested;
      const netChg = invested > 0 ? ((pnl / invested) * 100).toFixed(2) + "%" : "0.00%";
      const dayChg = live ? live.percent : (h.dayChg || "0.00%");

      totalInvested += invested;
      totalCurVal += curVal;

      return `
        <tr style="background: ${idx % 2 === 0 ? "#ffffff" : "#f8fafc"};">
          <td style="padding: 9px 12px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">${sym}</td>
          <td style="padding: 9px 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">${qty}</td>
          <td style="padding: 9px 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">₹${avgCost.toFixed(2)}</td>
          <td style="padding: 9px 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">₹${ltp.toFixed(2)}</td>
          <td style="padding: 9px 12px; text-align: right; border-bottom: 1px solid #e2e8f0; font-weight: bold;">
            ₹${curVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
          <td style="padding: 9px 12px; text-align: right; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: ${pnl >= 0 ? "#059669" : "#dc2626"};">
            ${pnl >= 0 ? "+" : ""}₹${pnl.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
          <td style="padding: 9px 12px; text-align: right; border-bottom: 1px solid #e2e8f0; color: ${pnl >= 0 ? "#059669" : "#dc2626"};">
            ${netChg}
          </td>
          <td style="padding: 9px 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">${dayChg}</td>
        </tr>
      `;
    })
    .join("");

  const totalPnl = totalCurVal - totalInvested;
  const totalPnlPct = totalInvested > 0 ? ((totalPnl / totalInvested) * 100).toFixed(2) : "0.00";

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download/print the PDF Statement.");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Demat Holdings Statement - ${userId} - ${today}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; margin: 0; padding: 20px; font-size: 12px; }
          .statement-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #387ed1; padding-bottom: 15px; margin-bottom: 20px; }
          .brand-title { font-size: 22px; font-weight: 800; color: #e15523; margin: 0; }
          .broker-sub { font-size: 11px; color: #64748b; margin-top: 3px; }
          .statement-title { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0; text-align: right; }
          .timestamp { font-size: 11px; color: #64748b; text-align: right; margin-top: 4px; }
          .client-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; }
          .client-item span { display: block; }
          .client-label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600; }
          .client-val { font-size: 12.5px; font-weight: 700; color: #0f172a; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          th { background: #f1f5f9; color: #475569; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 10px 12px; border-bottom: 2px solid #cbd5e1; }
          .summary-strip { display: flex; justify-content: space-between; background: #fafbfc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 20px; margin-bottom: 30px; }
          .summary-box span { display: block; }
          .summary-box-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; }
          .summary-box-val { font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 3px; }
          .disclaimer { font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="statement-header">
          <div>
            <h1 class="brand-title">ZERODHA</h1>
            <div class="broker-sub">Zerodha Broking Ltd. &bull; SEBI Reg No. INZ000031633 &bull; CDSL Depository</div>
          </div>
          <div>
            <h2 class="statement-title">DEMAT HOLDINGS STATEMENT</h2>
            <div class="timestamp">Generated on: ${today} at ${time}</div>
          </div>
        </div>

        <div class="client-grid">
          <div class="client-item">
            <span class="client-label">Client Name</span>
            <span class="client-val">${userName}</span>
          </div>
          <div class="client-item">
            <span class="client-label">Client ID / UCC</span>
            <span class="client-val">${userId}</span>
          </div>
          <div class="client-item">
            <span class="client-label">Demat BO ID (CDSL)</span>
            <span class="client-val">${demat}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Instrument</th>
              <th style="text-align: right;">Quantity</th>
              <th style="text-align: right;">Avg. Cost</th>
              <th style="text-align: right;">LTP</th>
              <th style="text-align: right;">Current Value</th>
              <th style="text-align: right;">Total P&L</th>
              <th style="text-align: right;">Net Chg.</th>
              <th style="text-align: right;">Day Chg.</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="summary-strip">
          <div class="summary-box">
            <span class="summary-box-label">Total Investment</span>
            <span class="summary-box-val">₹${totalInvested.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="summary-box">
            <span class="summary-box-label">Current Valuation</span>
            <span class="summary-box-val">₹${totalCurVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="summary-box">
            <span class="summary-box-label">Total Unrealized P&L</span>
            <span class="summary-box-val" style="color: ${totalPnl >= 0 ? "#059669" : "#dc2626"};">
              ${totalPnl >= 0 ? "+" : ""}₹${totalPnl.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${totalPnl >= 0 ? "+" : ""}${totalPnlPct}%)
            </span>
          </div>
        </div>

        <div class="disclaimer">
          <strong>Depository Disclosure:</strong> This document reflects the beneficial ownership of Demat holdings registered with Central Depository Services (India) Limited (CDSL). Valuation is computed using closing/live market prices.
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
