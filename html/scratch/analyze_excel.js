import * as XLSX from 'xlsx';
import fs from 'fs';

const filePath = 'd:/WorkSpace/Invoicer/ex/광성 0313 작업지시서.xlsx';
const fileBuffer = fs.readFileSync(filePath);
const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('Sample Data (Rows 10 to 30):');
console.log(JSON.stringify(data.slice(10, 30), null, 2));
