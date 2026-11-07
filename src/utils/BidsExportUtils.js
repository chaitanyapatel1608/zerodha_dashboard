/**
 * Professional Primary Markets & Bids Statement Exporter
 * Supports CSV, Excel (.xls), and Printable PDF Statement
 */

export const exportBidsToCSV = (ipos = [], applications = [], currentUser = {}) => {
  const userId = currentUser?.userId || "TRADER";
  const today = new Date().toISOString().split("T")[0];
  const filename = `Zerodha_Bids_Statement_${userId}_${today}.csv`;

  const headers = [
    "Type",
    "Symbol",
    "Company Name",
    "Category",
    "Date Range",
    "Price Range",
    "Lot Size",
    "My Status",
    "Application No",
    "Applied Lots",
    "Blocked Amount (INR)",
  ];

  const appMap = {};
  applications.forEach((a) => {
    if (a.status !== "CANCELLED") {
      appMap[a.ipoSymbol] = a;
    }
  });

  const rows = ipos.map((item) => {
    const app = appMap[item.symbol];
    const myStatus = app ? (app.mandateStatus === "ACCEPTED" ? "APPLIED" : "MANDATE PENDING") : item.status;
    const appNo = app ? app.applicationNumber : "-";
    const appliedLots = app ? app.lots : 0;
    const blockedAmt = app ? app.totalAmount : 0;

    return [
      `"${item.type || "IPO"}"`,
      `"${item.symbol}"`,
      `"${(item.name || "").replace(/"/g, '""')}"`,
      `"${item.category || "Mainboard"}"`,
      `"${item.dates || ""}"`,
      `"${item.priceRange || ""}"`,
      item.minQty || 1,
      myStatus,
      `"${appNo}"`,
      appliedLots,
      blockedAmt.toFixed(2),
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

export const exportBidsToExcel = (ipos = [], applications = [], currentUser = {}) => {
  const userId = currentUser?.userId || "TRADER";
  const userName = currentUser?.fullName || currentUser?.name || "Client";
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const filename = `Zerodha_Bids_Statement_${userId}_${new Date().toISOString().split("T")[0]}.xls`;

  const appMap = {};
  let totalLienBlocked = 0;
  applications.forEach((a) => {
    if (a.status !== "CANCELLED") {
      appMap[a.ipoSymbol] = a;
      totalLienBlocked += Number(a.totalAmount || 0);
    }
  });

  const tableRows = ipos
    .map((item) => {
      const app = appMap[item.symbol];
      const myStatus = app ? (app.mandateStatus === "ACCEPTED" ? "APPLIED" : "MANDATE PENDING") : item.status;
      const appNo = app ? app.applicationNumber : "-";
      const appliedLots = app ? `${app.lots} Lot (${app.totalQty} sh)` : "-";
      const blockedAmt = app ? `₹${app.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "-";

      return `
        <tr>
          <td>${item.symbol}</td>
          <td>${item.name}</td>
          <td>${item.dates}</td>
          <td>${item.priceRange}</td>
          <td align="right">${item.minQty}</td>
          <td>${item.minAmount}</td>
          <td><strong>${myStatus}</strong></td>
          <td>${appNo}</td>
          <td align="right">${appliedLots}</td>
          <td align="right">${blockedAmt}</td>
        </tr>
      `;
    })
    .join("");

  const excelTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>IPO & Bids Statement</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          th { background-color: #387ed1; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px; }
          td { border: 1px solid #e2e8f0; padding: 6px; }
          .header-title { font-size: 16pt; font-weight: bold; color: #387ed1; }
          .meta-text { font-size: 10pt; color: #64748b; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="10" class="header-title">ZERODHA PRIMARY MARKETS & BIDS STATEMENT</td></tr>
          <tr><td colspan="10" class="meta-text">Client: ${userName} (${userId}) | Generated: ${today} | Total ASBA Blocked: ₹${totalLienBlocked.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>
          <tr><td colspan="10"></td></tr>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Company Name</th>
              <th>Dates</th>
              <th>Price Range</th>
              <th>Lot Qty</th>
              <th>Min Investment</th>
              <th>Status</th>
              <th>App Number</th>
              <th>My Lots</th>
              <th>Blocked Lien</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
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

export const exportBidsToPDF = (ipos = [], applications = [], currentUser = {}) => {
  const userId = currentUser?.userId || "TRADER";
  const userName = currentUser?.fullName || currentUser?.name || "Client";
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const appMap = {};
  let totalLienBlocked = 0;
  applications.forEach((a) => {
    if (a.status !== "CANCELLED") {
      appMap[a.ipoSymbol] = a;
      totalLienBlocked += Number(a.totalAmount || 0);
    }
  });

  const rowsHtml = ipos
    .map((item) => {
      const app = appMap[item.symbol];
      const isApplied = !!app;
      const myStatus = app ? (app.mandateStatus === "ACCEPTED" ? "✓ APPLIED" : "⏳ MANDATE PENDING") : item.status;
      const statusColor = isApplied ? "#059669" : "#64748b";

      return `
        <tr style="${isApplied ? "background-color: #f0fdf4;" : ""}">
          <td class="font-bold">${item.symbol}</td>
          <td>${item.name}</td>
          <td>${item.dates}</td>
          <td>${item.priceRange}</td>
          <td class="text-right">${item.minAmount} (${item.minQty} sh)</td>
          <td class="text-center font-bold" style="color: ${statusColor};">${myStatus}</td>
          <td class="text-right">${app ? `₹${app.totalAmount.toLocaleString("en-IN")}` : "-"}</td>
        </tr>
      `;
    })
    .join("");

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to print your Bids statement.");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Primary Markets Statement - ${userId} - ${today}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 32px; margin: 0; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #387ed1; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 22px; font-weight: 700; color: #387ed1; margin: 0; }
          .meta { font-size: 13px; color: #64748b; margin-top: 4px; }
          .kpi-strip { display: flex; gap: 24px; margin-bottom: 20px; background: #f8fafc; padding: 12px 16px; border-radius: 6px; }
          .kpi-item { display: flex; flex-direction: column; }
          .kpi-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; }
          .kpi-val { font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin-top: 10px; }
          th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; font-size: 10.5px; text-transform: uppercase; color: #475569; }
          td { border: 1px solid #e2e8f0; padding: 7px 8px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .font-bold { font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">ZERODHA PRIMARY MARKETS & BIDS STATEMENT</h1>
            <div class="meta">Client: ${userName} (${userId}) | Generated: ${today}</div>
          </div>
        </div>
        <div class="kpi-strip">
          <div class="kpi-item">
            <span class="kpi-label">Active Applications</span>
            <span class="kpi-val">${applications.filter(a => a.status !== "CANCELLED").length} Issues</span>
          </div>
          <div class="kpi-item">
            <span class="kpi-label">Total ASBA Bank Lien</span>
            <span class="kpi-val" style="color: #059669;">₹${totalLienBlocked.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Symbol</th>
              <th style="text-align: left;">Company</th>
              <th>Dates</th>
              <th>Price Band</th>
              <th class="text-right">Min Investment</th>
              <th class="text-center">My Status</th>
              <th class="text-right">Blocked Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 350);
};
