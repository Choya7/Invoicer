import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Search, RotateCcw, Save, Trash2, Printer, Plus, Minus, X } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { updateInvoice } from '../../core/database';
import { exportToExcel } from '../../core/excelExport';
import ClientModal from './ClientModal';
import ItemModal from './ItemModal';

const MySwal = withReactContent(Swal);

export default function InvoiceModal({ isOpen, onClose, invoice, onSaved }) {
  const [issueDate, setIssueDate] = useState(new Date());
  const [clientName, setClientName] = useState('');
  const [taxCalcType, setTaxCalcType] = useState('separate');
  
  const [supplier, setSupplier] = useState({
    reg_no: '', name: '', owner: '', address: '', type: '', category: ''
  });

  const [rows, setRows] = useState([]);
  const [footer, setFooter] = useState({
    prev_balance: 0, total_sum: 0, deposit: 0, total_balance: 0, receiver: ''
  });
  const [grandTotal, setGrandTotal] = useState(0);

  const [isClientModalOpen, setClientModalOpen] = useState(false);
  const [isItemModalOpen, setItemModalOpen] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState(null);

  // Load invoice data when modal opens
  useEffect(() => {
    if (invoice && isOpen) {
      setIssueDate(new Date(invoice.issue_date));
      setClientName(invoice.client_name);
      setSupplier(invoice.data.supplier);
      setRows(invoice.data.items.map(it => ({...it})));
      setFooter(invoice.data.footer || { prev_balance: 0, total_sum: 0, deposit: 0, total_balance: 0, receiver: '' });
      setGrandTotal(invoice.data.grand_total);
    }
  }, [invoice, isOpen]);

  useEffect(() => {
    recalcTotal();
  }, [rows]);

  const handleRowChange = (index, field, value) => {
    setRows(prev => {
      const nw = [...prev];
      nw[index] = { ...nw[index], [field]: value };
      
      if (field === 'qty' || field === 'price' || field === 'taxCalcTypeTrigger') {
        const qty = parseFloat(nw[index].qty || 0);
        const price = parseFloat(nw[index].price || 0);
        
        if (qty === 0 && price === 0) {
          nw[index].supply = 0;
          nw[index].tax = 0;
        } else {
          if (taxCalcType === 'separate') {
            nw[index].supply = qty * price;
            nw[index].tax = Math.floor(nw[index].supply * 0.1);
          } else {
            const tot = qty * price;
            nw[index].supply = Math.floor(tot / 1.1);
            nw[index].tax = tot - nw[index].supply;
          }
        }
      }
      return nw;
    });
  };

  const recalcTotal = () => {
    let tSupply = 0;
    let tTax = 0;
    rows.forEach(r => {
      tSupply += r.supply || 0;
      tTax += r.tax || 0;
    });
    const gt = tSupply + tTax;
    setGrandTotal(gt);
    setFooter(f => ({ ...f, total_sum: gt, total_balance: gt }));
  };

  const handleUpdate = async () => {
    const validRows = rows.filter(r => r.name.trim() !== '');
    if (validRows.length === 0) {
      MySwal.fire('수정 실패', '명세서에 최소 1개 이상의 물품 내역을 작성해주세요.', 'error');
      return;
    }

    const data = {
      supplier,
      items: validRows,
      footer,
      grand_total: grandTotal
    };

    await updateInvoice(invoice.id, issueDate.toISOString().split('T')[0], clientName, data);
    MySwal.fire('수정 완료', '명세서 정보가 업데이트되었습니다.', 'success');
    onSaved();
    onClose();
  };

  const insertRow = () => {
    const dStr = `${String(issueDate.getMonth() + 1).padStart(2, '0')}.${String(issueDate.getDate()).padStart(2, '0')}`;
    setRows([...rows, { date: dStr, code: '', name: '', spec: '', qty: '', price: '', supply: 0, tax: 0, note: '' }]);
  };

  const removeRow = () => {
    if (rows.length > 1) setRows(rows.slice(0, rows.length - 1));
  };

  const handlePrintExcel = () => {
    exportToExcel({
      supplier,
      clientName,
      issueDate,
      items: rows,
      grandTotal
    });
    MySwal.fire('엑셀 변환 완료', '파일이 생성되었습니다.', 'success');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '1200px', width: '95%', maxHeight: '95vh', overflow: 'auto' }}>
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            명세서 상세 및 수정 <span className="text-xs font-normal text-muted">ID: {invoice?.id}</span>
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
        </div>

        <div className="flex-responsive justify-between items-center mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200 gap-4">
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            <button className="btn btn-primary" onClick={handleUpdate}><Save size={16}/> 수정 내용 저장</button>
            <button className="btn" onClick={handlePrintExcel}><Printer size={16}/> 이 건만 별도 출력 (Excel)</button>
          </div>
          <div className="flex gap-4 items-center justify-center">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="radio" name="taxTypeEdit" checked={taxCalcType === 'separate'} onChange={() => setTaxCalcType('separate')} />
              VAT 별도
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="radio" name="taxTypeEdit" checked={taxCalcType === 'include'} onChange={() => setTaxCalcType('include')} />
              VAT 포함
            </label>
          </div>
        </div>

        <div className="card p-4 md:p-6 shadow-sm border-t-4 border-primary">
          <div className="flex-responsive gap-6 mb-6">
            <div className="flex-1 border-2 border-slate-200 rounded-lg p-3 md:p-4">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold underline underline-offset-8 decoration-primary">거 래 명 세 서</h3>
              </div>
              <div className="grid md-grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm w-16">발행일</span>
                  <DatePicker selected={issueDate} onChange={setIssueDate} dateFormat="yyyy-MM-dd" className="form-input" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm w-16">거래처</span>
                  <div className="flex gap-1 flex-1">
                    <input className="form-input" value={clientName} onChange={e => setClientName(e.target.value)} />
                    <button className="btn btn-primary p-1" onClick={() => setClientModalOpen(true)}><Search size={16}/></button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex gap-4 border-2 border-slate-200 rounded-lg p-3 md:p-4">
               <div className="bg-primary text-white font-bold p-3 rounded flex items-center justify-center text-center leading-loose mobile-hide" style={{ writingMode: 'vertical-rl', letterSpacing: '0.3em' }}>공급자</div>
               <div className="grid md-grid-cols-4 gap-2 flex-1 items-center">
                  <span className="text-xs font-bold">등록번호</span>
                  <input className="form-input text-xs col-span-3" value={supplier.reg_no} onChange={e => setSupplier({...supplier, reg_no: e.target.value})} />
                  
                  <span className="text-xs font-bold">상 호</span>
                  <input className="form-input text-xs" value={supplier.name} onChange={e => setSupplier({...supplier, name: e.target.value})} />
                  <span className="text-xs font-bold text-center">성 명</span>
                  <input className="form-input text-xs" value={supplier.owner} onChange={e => setSupplier({...supplier, owner: e.target.value})} />
                  
                  <span className="text-xs font-bold">사업장</span>
                  <input className="form-input text-xs col-span-3" value={supplier.address} onChange={e => setSupplier({...supplier, address: e.target.value})} />
                  
                  <span className="text-xs font-bold">업 태</span>
                  <input className="form-input text-xs" value={supplier.type} onChange={e => setSupplier({...supplier, type: e.target.value})} />
                  <span className="text-xs font-bold text-center">종 목</span>
                  <input className="form-input text-xs" value={supplier.category} onChange={e => setSupplier({...supplier, category: e.target.value})} />
               </div>
            </div>
          </div>

          <div className="mb-4 bg-orange-50 border border-orange-200 p-3 rounded-lg flex justify-between items-center">
             <span className="font-bold text-orange-900">합계금액</span>
             <span className="text-2xl font-black text-danger">{grandTotal.toLocaleString()} <span className="text-sm font-normal text-muted">원</span></span>
          </div>

          <div className="table-container mb-4">
            <table className="table table-responsive">
              <thead>
                <tr className="bg-slate-100">
                  <th style={{ width: '120px' }}>월일</th>
                  <th style={{ width: '100px' }}>코드</th>
                  <th>품목</th>
                  <th style={{ width: '120px' }}>규격</th>
                  <th style={{ width: '100px' }}>수량</th>
                  <th style={{ width: '120px' }}>단가</th>
                  <th style={{ width: '130px' }}>공급가액</th>
                  <th style={{ width: '110px' }}>세액</th>
                  <th style={{ width: '150px' }}>비고</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td data-label="월일" className="p-1"><input className="form-input text-xs text-center p-1 h-8 bg-gray-50" value={row.date} readOnly /></td>
                    <td data-label="코드" className="p-1"><input className="form-input text-xs text-center p-1 h-8 font-bold" value={row.code} readOnly onDoubleClick={() => {setActiveRowIndex(i); setItemModalOpen(true);}} /></td>
                    <td data-label="품목" className="p-1"><input className="form-input text-xs p-1 h-8" value={row.name} onChange={e => handleRowChange(i, 'name', e.target.value)} /></td>
                    <td data-label="규격" className="p-1"><input className="form-input text-xs text-center p-1 h-8" value={row.spec} onChange={e => handleRowChange(i, 'spec', e.target.value)} /></td>
                    <td data-label="수량" className="p-1"><input className="form-input text-xs text-right p-1 h-8" type="number" value={row.qty} onChange={e => handleRowChange(i, 'qty', e.target.value)} /></td>
                    <td data-label="단가" className="p-1"><input className="form-input text-xs text-right p-1 h-8" type="number" value={row.price} onChange={e => handleRowChange(i, 'price', e.target.value)} /></td>
                    <td data-label="공급가액" className="p-1"><input className="form-input text-xs text-right p-1 h-8 bg-gray-50 font-bold" value={row.supply?.toLocaleString()} readOnly /></td>
                    <td data-label="세액" className="p-1"><input className="form-input text-xs text-right p-1 h-8 bg-gray-50 font-bold" value={row.tax?.toLocaleString()} readOnly /></td>
                    <td data-label="비고" className="p-1"><input className="form-input text-xs p-1 h-8" value={row.note} onChange={e => handleRowChange(i, 'note', e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <button className="btn text-xs" onClick={insertRow}><Plus size={14}/> 줄 추가</button>
            <button className="btn text-xs text-danger" onClick={removeRow}><Minus size={14}/> 줄 삭제</button>
          </div>
        </div>

        <ClientModal 
          isOpen={isClientModalOpen} onClose={() => setClientModalOpen(false)} 
          onSelect={(c) => { setClientName(c.name); setClientModalOpen(false); }} 
        />
        <ItemModal 
          isOpen={isItemModalOpen} onClose={() => setItemModalOpen(false)} 
          onSelect={(item) => { 
            if (activeRowIndex !== null) {
              handleRowChange(activeRowIndex, 'code', item.code);
              handleRowChange(activeRowIndex, 'name', item.name);
              handleRowChange(activeRowIndex, 'spec', item.spec);
              handleRowChange(activeRowIndex, 'price', item.price);
              handleRowChange(activeRowIndex, 'qty', 1);
            }
            setItemModalOpen(false); 
          }} 
        />
      </div>
    </div>
  );
}
