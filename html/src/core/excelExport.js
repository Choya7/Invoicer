import XLSX from 'xlsx-js-style';

/**
 * Common Styles and Utils for Excel Export
 */
const BORDER_STYLE = {
  top: { style: "thin" }, bottom: { style: "thin" },
  left: { style: "thin" }, right: { style: "thin" }
};

const STYLE_TITLE = {
  font: { name: '맑은 고딕', sz: 20, bold: true },
  alignment: { horizontal: 'center', vertical: 'center' }
};
const STYLE_SUBTITLE = {
  font: { name: '맑은 고딕', sz: 10 },
  alignment: { horizontal: 'center', vertical: 'center' }
};
const STYLE_HEADER_GRAY = {
  fill: { fgColor: { rgb: "EFEFEF" } },
  font: { bold: true, name: '맑은 고딕' },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: BORDER_STYLE
};
const STYLE_DATA_CENTER = {
  font: { name: '맑은 고딕' },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: BORDER_STYLE
};
const STYLE_DATA_RIGHT = {
  font: { name: '맑은 고딕' },
  alignment: { horizontal: 'right', vertical: 'center' },
  border: BORDER_STYLE
};
const STYLE_DATA_NUMBER = {
  font: { name: '맑은 고딕' },
  numFmt: "#,##0",
  alignment: { horizontal: 'right', vertical: 'center' },
  border: BORDER_STYLE
};
const STYLE_LABEL_BOLD = {
  font: { bold: true, name: '맑은 고딕', sz: 11 },
  alignment: { horizontal: 'left' }
};

/**
 * Helper to write a single cell with style
 */
const writeCell = (ws, r, c, val, style = {}, range) => {
  const ref = XLSX.utils.encode_cell({ r, c });
  ws[ref] = { v: val, s: style, t: typeof val === 'number' ? 'n' : 's' };
  if (range.e.r < r) range.e.r = r;
  if (range.e.c < c) range.e.c = c;
};

/**
 * Helper to apply a style to an entire range
 */
const writeStyleToRange = (ws, startR, startC, endR, endC, style = {}) => {
  for (let r = startR; r <= endR; r++) {
    for (let c = startC; c <= endC; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (!ws[ref]) {
        ws[ref] = { v: "", s: style, t: 's' };
      } else {
        ws[ref].s = { ...ws[ref].s, ...style };
      }
    }
  }
};

/**
 * Generates a styled worksheet for a single invoice
 */
const buildInvoiceWorksheet = (data) => {
  const { supplier, clientName, issueDate, items, grandTotal } = data;
  const dateStr = typeof issueDate === 'string' ? issueDate : issueDate.toISOString().split('T')[0];
  
  const ws = {};
  const range = { s: { c: 0, r: 0 }, e: { c: 8, r: 0 } };

  // 1. Title Area
  writeCell(ws, 0, 0, "거 래 명 세 서", STYLE_TITLE, range);
  writeCell(ws, 1, 0, "(공급받는자 보관용)", STYLE_SUBTITLE, range);

  // 2. Info Block
  writeCell(ws, 3, 0, "[ 발행 정보 ]", STYLE_LABEL_BOLD, range);
  writeCell(ws, 3, 4, "[ 공급자 정보 ]", STYLE_LABEL_BOLD, range);

  writeCell(ws, 4, 0, "발행일", STYLE_HEADER_GRAY, range);
  writeCell(ws, 4, 1, dateStr, STYLE_DATA_CENTER, range);
  writeStyleToRange(ws, 4, 1, 4, 3, STYLE_DATA_CENTER);

  writeCell(ws, 4, 4, "등록번호", STYLE_HEADER_GRAY, range);
  writeCell(ws, 4, 5, supplier.reg_no, STYLE_DATA_CENTER, range);
  writeStyleToRange(ws, 4, 5, 4, 8, STYLE_DATA_CENTER);

  writeCell(ws, 5, 0, "거래처명", STYLE_HEADER_GRAY, range);
  writeCell(ws, 5, 1, clientName || "미지정", STYLE_DATA_CENTER, range);
  writeStyleToRange(ws, 5, 1, 5, 3, STYLE_DATA_CENTER);

  writeCell(ws, 5, 4, "상 호", STYLE_HEADER_GRAY, range);
  writeCell(ws, 5, 5, supplier.name, STYLE_DATA_CENTER, range);
  writeStyleToRange(ws, 5, 5, 5, 6, STYLE_DATA_CENTER);

  writeCell(ws, 5, 7, "성 명", STYLE_HEADER_GRAY, range);
  writeCell(ws, 5, 8, supplier.owner, STYLE_DATA_CENTER, range);

  writeCell(ws, 6, 4, "사업장", STYLE_HEADER_GRAY, range);
  writeCell(ws, 6, 5, supplier.address, STYLE_DATA_CENTER, range);
  writeStyleToRange(ws, 6, 5, 6, 8, STYLE_DATA_CENTER);

  writeCell(ws, 7, 4, "업 태", STYLE_HEADER_GRAY, range);
  writeCell(ws, 7, 5, supplier.type, STYLE_DATA_CENTER, range);
  writeStyleToRange(ws, 7, 5, 7, 6, STYLE_DATA_CENTER);

  writeCell(ws, 7, 7, "종 목", STYLE_HEADER_GRAY, range);
  writeCell(ws, 7, 8, supplier.category, STYLE_DATA_CENTER, range);

  writeCell(ws, 9, 0, "합계금액", STYLE_HEADER_GRAY, range);
  writeCell(ws, 9, 1, Number(grandTotal), { ...STYLE_DATA_NUMBER, font: { bold: true, sz: 12, color: { rgb: "FF0000" } } }, range);
  writeStyleToRange(ws, 9, 1, 9, 2, { ...STYLE_DATA_NUMBER, font: { bold: true, sz: 12, color: { rgb: "FF0000" } } });
  writeCell(ws, 9, 3, "원", STYLE_DATA_CENTER, range);
  writeStyleToRange(ws, 9, 3, 9, 8, STYLE_DATA_CENTER);

  // 3. Items Table
  const tableStartRow = 11;
  const tableHeaders = ["월일", "품목코드", "품목", "규격", "수량", "단가", "공급가액", "세액", "비고"];
  tableHeaders.forEach((h, i) => writeCell(ws, tableStartRow, i, h, STYLE_HEADER_GRAY, range));

  items.forEach((item, idx) => {
    const r = tableStartRow + 1 + idx;
    writeCell(ws, r, 0, item.date || "", STYLE_DATA_CENTER, range);
    writeCell(ws, r, 1, item.code || "", STYLE_DATA_CENTER, range);
    writeCell(ws, r, 2, item.name || "", STYLE_DATA_CENTER, range);
    writeCell(ws, r, 3, item.spec || "", STYLE_DATA_CENTER, range);
    writeCell(ws, r, 4, Number(item.qty) || 0, STYLE_DATA_NUMBER, range);
    writeCell(ws, r, 5, Number(item.price) || 0, STYLE_DATA_NUMBER, range);
    writeCell(ws, r, 6, Number(item.supply) || 0, STYLE_DATA_NUMBER, range);
    writeCell(ws, r, 7, Number(item.tax) || 0, STYLE_DATA_NUMBER, range);
    writeCell(ws, r, 8, item.note || "", STYLE_DATA_CENTER, range);
  });

  // 4. Footer
  const footerRow = tableStartRow + items.length + 2;
  writeCell(ws, footerRow, 0, "총합계", STYLE_HEADER_GRAY, range);
  writeCell(ws, footerRow, 1, Number(grandTotal), { ...STYLE_DATA_NUMBER, font: { bold: true } }, range);
  writeStyleToRange(ws, footerRow, 1, footerRow, 8, { ...STYLE_DATA_NUMBER, font: { bold: true } });

  ws['!ref'] = XLSX.utils.encode_range(range);
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
    { s: { r: 4, c: 1 }, e: { r: 4, c: 3 } },
    { s: { r: 5, c: 1 }, e: { r: 5, c: 3 } },
    { s: { r: 4, c: 5 }, e: { r: 4, c: 8 } },
    { s: { r: 5, c: 5 }, e: { r: 5, c: 6 } },
    { s: { r: 6, c: 5 }, e: { r: 6, c: 8 } },
    { s: { r: 7, c: 5 }, e: { r: 7, c: 6 } },
    { s: { r: 9, c: 1 }, e: { r: 9, c: 2 } },
    { s: { r: 9, c: 3 }, e: { r: 9, c: 8 } },
    { s: { r: footerRow, c: 1 }, e: { r: footerRow, c: 8 } }
  ];
  ws['!cols'] = [
    { wch: 10 }, { wch: 12 }, { wch: 20 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 20 }
  ];

  return ws;
};

/**
 * Exports a single invoice
 */
export const exportToExcel = (data) => {
  const wb = XLSX.utils.book_new();
  const ws = buildInvoiceWorksheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "거래명세서");
  const dateStr = typeof data.issueDate === 'string' ? data.issueDate : data.issueDate.toISOString().split('T')[0];
  const fileName = `거래명세서_${data.clientName || '미지정'}_${dateStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * Exports multiple invoices into a single file
 * @param {Array} invoiceList 
 * @param {string} periodRange 
 * @param {string} mode - 'summary' or 'detail'
 */
export const exportInvoicesToExcel = (invoiceList, periodRange, mode = 'detail') => {
  const wb = XLSX.utils.book_new();
  
  if (mode === 'summary') {
    // Mode Summary: List of invoices (one row each) + individual sheets
    const summaryWs = {};
    const sRange = { s: { c: 0, r: 0 }, e: { c: 5, r: 0 } };
    
    writeCell(summaryWs, 0, 0, "거래명세서 통합 요약표", STYLE_TITLE, sRange);
    writeCell(summaryWs, 1, 0, `조회 기간: ${periodRange}`, STYLE_SUBTITLE, sRange);
    
    const sumHeaders = ["일자", "거래처", "품목요약", "합계금액", "공급가액", "세액"];
    sumHeaders.forEach((h, i) => writeCell(summaryWs, 3, i, h, STYLE_HEADER_GRAY, sRange));
    
    let totalAll = 0;
    invoiceList.forEach((inv, idx) => {
      const r = 4 + idx;
      const items = inv.data.items;
      const summary = items.length > 1 ? `${items[0].name} 외 ${items.length - 1}건` : (items[0]?.name || "");
      const supply = items.reduce((sum, it) => sum + (it.supply || 0), 0);
      const tax = items.reduce((sum, it) => sum + (it.tax || 0), 0);
      
      writeCell(summaryWs, r, 0, inv.issue_date, STYLE_DATA_CENTER, sRange);
      writeCell(summaryWs, r, 1, inv.client_name, STYLE_DATA_CENTER, sRange);
      writeCell(summaryWs, r, 2, summary, STYLE_DATA_CENTER, sRange);
      writeCell(summaryWs, r, 3, supply + tax, STYLE_DATA_NUMBER, sRange);
      writeCell(summaryWs, r, 4, supply, STYLE_DATA_NUMBER, sRange);
      writeCell(summaryWs, r, 5, tax, STYLE_DATA_NUMBER, sRange);
      totalAll += (supply + tax);
    });
    
    const footerR = 4 + invoiceList.length + 1;
    writeCell(summaryWs, footerR, 0, "총 합계", STYLE_HEADER_GRAY, sRange);
    writeCell(summaryWs, footerR, 1, totalAll, { ...STYLE_DATA_NUMBER, font: { bold: true } }, sRange);
    writeStyleToRange(summaryWs, footerR, 1, footerR, 5, { ...STYLE_DATA_NUMBER, font: { bold: true } });

    summaryWs['!ref'] = XLSX.utils.encode_range(sRange);
    summaryWs['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
      { s: { r: footerR, c: 1 }, e: { r: footerR, c: 5 } }
    ];
    summaryWs['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];

    XLSX.utils.book_append_sheet(wb, summaryWs, "통합요약");

    // Add individual sheets too for summary mode
    invoiceList.forEach((inv, idx) => {
      const ws = buildInvoiceWorksheet({
        supplier: inv.data.supplier,
        clientName: inv.client_name,
        issueDate: inv.issue_date,
        items: inv.data.items,
        grandTotal: inv.data.grand_total || 0
      });
      const tabName = `${idx + 1}_${inv.client_name.substring(0, 10)}_${inv.issue_date.slice(5)}`;
      XLSX.utils.book_append_sheet(wb, ws, tabName.slice(0, 31));
    });

  } else {
    // Mode Detail: Combined Items List (Essential for the user's "Gather lists into one" request)
    const detailWs = {};
    const dRange = { s: { c: 0, r: 0 }, e: { c: 9, r: 0 } };

    writeCell(detailWs, 0, 0, "통합 품목 상세 내역서", STYLE_TITLE, dRange);
    writeCell(detailWs, 1, 0, `조회 기간: ${periodRange}`, STYLE_SUBTITLE, dRange);

    const detailHeaders = ["발행일", "거래처", "품목코드", "품목", "규격", "수량", "단가", "공급가액", "세액", "비고"];
    detailHeaders.forEach((h, i) => writeCell(detailWs, 3, i, h, STYLE_HEADER_GRAY, dRange));

    let currentRow = 4;
    let tSupply = 0, tTax = 0;
    
    invoiceList.forEach(inv => {
      inv.data.items.forEach(item => {
        writeCell(detailWs, currentRow, 0, inv.issue_date, STYLE_DATA_CENTER, dRange);
        writeCell(detailWs, currentRow, 1, inv.client_name, STYLE_DATA_CENTER, dRange);
        writeCell(detailWs, currentRow, 2, item.code || "", STYLE_DATA_CENTER, dRange);
        writeCell(detailWs, currentRow, 3, item.name || "", STYLE_DATA_CENTER, dRange);
        writeCell(detailWs, currentRow, 4, item.spec || "", STYLE_DATA_CENTER, dRange);
        writeCell(detailWs, currentRow, 5, Number(item.qty) || 0, STYLE_DATA_NUMBER, dRange);
        writeCell(detailWs, currentRow, 6, Number(item.price) || 0, STYLE_DATA_NUMBER, dRange);
        writeCell(detailWs, currentRow, 7, Number(item.supply) || 0, STYLE_DATA_NUMBER, dRange);
        writeCell(detailWs, currentRow, 8, Number(item.tax) || 0, STYLE_DATA_NUMBER, dRange);
        writeCell(detailWs, currentRow, 9, item.note || "", STYLE_DATA_CENTER, dRange);
        
        tSupply += (Number(item.supply) || 0);
        tTax += (Number(item.tax) || 0);
        currentRow++;
      });
    });

    // Total Row
    writeCell(detailWs, currentRow, 0, "총 합계", STYLE_HEADER_GRAY, dRange);
    writeCell(detailWs, currentRow, 7, tSupply, { ...STYLE_DATA_NUMBER, font: { bold: true } }, dRange);
    writeCell(detailWs, currentRow, 8, tTax, { ...STYLE_DATA_NUMBER, font: { bold: true } }, dRange);
    writeCell(detailWs, currentRow, 9, `합계: ${(tSupply + tTax).toLocaleString()} 원`, { ...STYLE_DATA_RIGHT, font: { bold: true } }, dRange);
    writeStyleToRange(detailWs, currentRow, 1, currentRow, 6, STYLE_HEADER_GRAY);

    detailWs['!ref'] = XLSX.utils.encode_range(dRange);
    detailWs['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
      { s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 6 } }
    ];
    detailWs['!cols'] = [
      { wch: 12 }, { wch: 18 }, { wch: 12 }, { wch: 22 }, { wch: 12 }, 
      { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(wb, detailWs, "통합상세품목");
  }

  const fileName = `거래명세서_통합출력_${mode}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
