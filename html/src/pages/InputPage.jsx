import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Search, RotateCcw, Save, Trash2, Printer, Plus, Minus } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { saveInvoice, getAllInvoices, updateInvoice, generateFormattedId } from '../core/database';
import { exportToExcel } from '../core/excelExport';
import ClientModal from '../components/modals/ClientModal';
import ItemModal from '../components/modals/ItemModal';

const MySwal = withReactContent(Swal);

export default function InputPage() {
  const [issueDate, setIssueDate] = useState(new Date());
  const [clientName, setClientName] = useState('');
  
  const [taxCalcType, setTaxCalcType] = useState('separate'); // separate, include
  const [supplier, setSupplier] = useState({
    reg_no: '760-24-02241', name: '광성', owner: '정광성', 
    address: '대구광역시 달성군 다사읍 세천로 955 2층', type: '제조업', category: '침구류'
  });

  const [rows, setRows] = useState(Array.from({ length: 3 }, () => ({
    date: '', code: '', name: '', spec: '', qty: '', price: '', supply: 0, tax: 0, note: ''
  })));
  
  const [footer, setFooter] = useState({
    prev_balance: 0, total_sum: 0, deposit: 0, total_balance: 0, receiver: ''
  });

  const [grandTotal, setGrandTotal] = useState(0);

  const [isClientModalOpen, setClientModalOpen] = useState(false);
  
  const [activeRowIndex, setActiveRowIndex] = useState(null);
  const [isItemModalOpen, setItemModalOpen] = useState(false);
  const [currentId, setCurrentId] = useState(null); // Track session-based ID

  useEffect(() => {
    // Update dates on all empty rows if issueDate changes
    const dStr = `${String(issueDate.getMonth() + 1).padStart(2, '0')}.${String(issueDate.getDate()).padStart(2, '0')}`;
    setRows(prev => prev.map(r => ({ ...r, date: dStr })));
  }, [issueDate]);

  useEffect(() => {
    recalcTotal();
  }, [rows]);

  const handleRowChange = (index, field, value) => {
    setRows(prev => {
      const nw = [...prev];
      nw[index] = { ...nw[index], [field]: value };
      
      // Auto calc if qty or price changes
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

  useEffect(() => {
    // Retrigger tax calculation when mode changes
    rows.forEach((_, i) => handleRowChange(i, 'taxCalcTypeTrigger', true));
  }, [taxCalcType]);

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

  const handleSave = async () => {
    if (!clientName) {
      MySwal.fire('저장 실패', '거래처를 선택하거나 입력해주세요.', 'error');
      return;
    }
    const validRows = rows.filter(r => r.name.trim() !== '');
    if (validRows.length === 0) {
      MySwal.fire('저장 실패', '명세서에 최소 1개 이상의 물품 내역을 작성해주세요.', 'error');
      return;
    }

    const dateStr = issueDate.toISOString().split('T')[0];
    const data = {
      supplier,
      items: validRows,
      footer,
      grand_total: grandTotal
    };

    // If we already have a session ID, it means we are saving again
    if (currentId) {
      const result = await MySwal.fire({
        title: '덮어쓰기 확인',
        html: `이미 한 번 저장된 명세표입니다.<br/><small class="text-muted">고유 코드: ${currentId}</small><br/><br/>현재 내용으로 기존 내역을 덮어쓰시겠습니까?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '예, 덮어씁니다',
        cancelButtonText: '아니오, 취소합니다',
        reverseButtons: true
      });

      if (result.isConfirmed) {
        await updateInvoice(currentId, dateStr, clientName, data);
        MySwal.fire('업데이트 완료', '명세표가 성공적으로 수정되었습니다.', 'success');
        return;
      } else {
        return;
      }
    }

    // First time saving in this session
    const newId = generateFormattedId(dateStr, clientName);
    
    // Safety check: Does this exact ID somehow exist in DB? (rare but possible)
    const allInvoices = await getAllInvoices();
    const existing = allInvoices.find(inv => inv.id === newId);

    if (existing) {
      // This case handles if a DIFFERENT session generated the same ID (unlikely due to UUID)
      // or if Date+Client+Random matches a previous file.
       const result = await MySwal.fire({
        title: '동일 코드 발견',
        html: `동일한 고유 코드를 가진 명세표가 이미 DB에 존재합니다.<br/><small class="text-muted">ID: ${newId}</small><br/><br/>해당 내역 위에 덮어쓰시겠습니까?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '예, 덮어씁니다',
        cancelButtonText: '아니오, 새로 저장',
        reverseButtons: true
      });
      
      if (result.isConfirmed) {
        await updateInvoice(newId, dateStr, clientName, data);
        setCurrentId(newId);
        MySwal.fire('업데이트 완료', '기존 데이터가 업데이트되었습니다.', 'success');
        return;
      } else {
        // Fallback to random UUID if user wants a clean new one
        const fallbackId = `${newId}_duplicated`;
        await saveInvoice(dateStr, clientName, data, fallbackId);
        setCurrentId(fallbackId);
        MySwal.fire('신규 저장', '새로운 코드로 저장되었습니다.', 'success');
        return;
      }
    }

    const savedId = await saveInvoice(dateStr, clientName, data, newId);
    setCurrentId(savedId);
    MySwal.fire('저장 완료', `명세서가 성공적으로 저장되었습니다.\n고유 코드: ${savedId}`, 'success');
  };

  const clearForm = () => {
    setIssueDate(new Date());
    setClientName('');
    setCurrentId(null); // Reset session ID
    const dStr = `${String(new Date().getMonth() + 1).padStart(2, '0')}.${String(new Date().getDate()).padStart(2, '0')}`;
    setRows(Array.from({ length: 3 }, () => ({
      date: dStr, code: '', name: '', spec: '', qty: '', price: '', supply: 0, tax: 0, note: ''
    })));
  };

  const insertRow = () => {
    const dStr = `${String(issueDate.getMonth() + 1).padStart(2, '0')}.${String(issueDate.getDate()).padStart(2, '0')}`;
    setRows([...rows, { date: dStr, code: '', name: '', spec: '', qty: '', price: '', supply: 0, tax: 0, note: '' }]);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === 'Enter') {
        e.preventDefault();
        insertRow();
      } else if (e.altKey && e.key === 'Delete') {
        e.preventDefault();
        removeRow();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rows, issueDate]);

  const removeRow = () => {
    if (rows.length > 1) {
      setRows(rows.slice(0, rows.length - 1));
    }
  };

  const handlePrintExcel = () => {
    const validRows = rows.filter(r => r.name.trim() !== '' || r.qty || r.price);
    if (!clientName && validRows.length === 0) {
      MySwal.fire('엑셀 변환 실패', '데이터가 비어있습니다.', 'warning');
      return;
    }
    
    exportToExcel({
      supplier,
      clientName: clientName || '(거래처 미지정)',
      issueDate,
      items: validRows,
      grandTotal
    });
    
    MySwal.fire('엑셀 변환 완료', '파일이 생성되었습니다.', 'success');
  };

  return (
    <div className="flex-col gap-4">
      {/* Toolbar */}
      <div className="card p-4 flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
          <button className="btn btn-primary" onClick={clearForm}><RotateCcw size={16}/> 새로작성</button>
          <button className="btn btn-primary" onClick={handleSave}><Save size={16}/> 저장</button>
          <button className="btn"><Trash2 size={16} className="text-danger"/> 삭제</button>
          <button className="btn" onClick={handlePrintExcel}><Printer size={16}/> 인쇄 (Excel)</button>
        </div>
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="radio" name="taxType" checked={taxCalcType === 'separate'} onChange={() => setTaxCalcType('separate')} />
            VAT 별도
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="radio" name="taxType" checked={taxCalcType === 'include'} onChange={() => setTaxCalcType('include')} />
            VAT 포함
          </label>
        </div>
      </div>

      <div className="flex-responsive gap-6">
        {/* Document Body */}
        <div className="flex-1 card p-6 shadow-md" style={{ borderTop: '4px solid var(--color-primary)' }}>
          {/* Header */}
          <div className="flex-responsive gap-6 mb-6">
            <div className="flex-1" style={{ border: '2px solid var(--color-border)', borderRadius: '8px', padding: '1rem' }}>
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold" style={{ letterSpacing: '0.5rem', color: 'var(--color-primary-hover)' }}>거래명세서</h2>
                <p className="text-sm text-muted">(공급받는자 보관용)</p>
              </div>
              <div className="grid md-grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm w-16">발행일</span>
                  <DatePicker 
                    selected={issueDate} onChange={(date) => setIssueDate(date)} 
                    dateFormat="yyyy-MM-dd" className="form-input"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm w-16">거래처</span>
                  <div className="flex gap-1 flex-1">
                    <input className="form-input" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="거래처 직접입력 또는 검색" />
                    <button className="btn btn-primary" style={{ padding: '0.5rem' }} onClick={() => setClientModalOpen(true)}><Search size={16}/></button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex gap-4" style={{ border: '2px solid var(--color-border)', borderRadius: '8px', padding: '1rem', position: 'relative' }}>
               <div className="mobile-hide" style={{ writingMode: 'vertical-rl', textAlign: 'center', fontWeight: 'bold', background: 'var(--color-primary)', padding: '0.8rem', borderRadius: '6px', color: 'white', fontSize: '1.1rem', letterSpacing: '0.3rem' }}>공급자</div>
               <div className="grid gap-2 flex-1 md-grid-cols-4">
                  <span className="font-semibold text-sm self-center">등록번호</span>
                  <input className="form-input text-sm" value={supplier.reg_no} onChange={e => setSupplier({...supplier, reg_no: e.target.value})} style={{ gridColumn: 'span 3' }} />
                  
                  <span className="font-semibold text-sm self-center">상 호</span>
                  <input className="form-input text-sm" value={supplier.name} onChange={e => setSupplier({...supplier, name: e.target.value})} />
                  
                  <span className="font-semibold text-sm self-center text-center">성 명</span>
                  <input className="form-input text-sm" value={supplier.owner} onChange={e => setSupplier({...supplier, owner: e.target.value})} />
                  
                  <span className="font-semibold text-sm self-center">사업장</span>
                  <input className="form-input text-sm" value={supplier.address} onChange={e => setSupplier({...supplier, address: e.target.value})} style={{ gridColumn: 'span 3' }} />
                  
                  <span className="font-semibold text-sm self-center">업 태</span>
                  <input className="form-input text-sm" value={supplier.type} onChange={e => setSupplier({...supplier, type: e.target.value})} />
                  
                  <span className="font-semibold text-sm self-center text-center">종 목</span>
                  <input className="form-input text-sm" value={supplier.category} onChange={e => setSupplier({...supplier, category: e.target.value})} />
               </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4 bg-orange-50 p-3 rounded-lg border border-orange-200">
            <div className="font-bold text-lg text-orange-800" style={{ minWidth: '100px' }}>합계금액</div>
            <div className="text-2xl font-bold text-danger text-right flex-1">{grandTotal.toLocaleString()} <span className="text-sm text-muted font-normal">원</span></div>
          </div>

          <div className="table-container mb-6" style={{ overflowX: 'auto' }}>
            <table className="table table-responsive">
              <thead>
                <tr>
                  <th style={{ width: '130px', textAlign: 'center' }}>월일</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>품목코드</th>
                  <th style={{ textAlign: 'center' }}>품목</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>규격</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>수량</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>단가</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>공급가액</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>세액</th>
                  <th style={{ width: '150px', textAlign: 'center' }}>비고</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="group hover-bg">
                    <td data-label="월일" className="p-1"><input className="form-input text-center text-xs p-1 h-8 bg-gray-100 text-gray-500 font-semibold" value={row.date} readOnly tabIndex={-1} title="발행일이 자동으로 입력됩니다" /></td>
                    <td data-label="품목코드" className="p-1"><input className="form-input text-center text-xs p-1 h-8 bg-gray-100 focus-bg-white font-bold" value={row.code} readOnly onDoubleClick={() => {setActiveRowIndex(i); setItemModalOpen(true);}} title="더블 클릭하여 물품 검색" /></td>
                    <td data-label="품목" className="p-1 flex gap-1">
                      <input className="form-input text-xs p-1 h-8 flex-1" value={row.name} onChange={e => handleRowChange(i, 'name', e.target.value)} />
                      <button className="btn" style={{ padding: '0.2rem 0.4rem', height: '32px' }} onClick={() => { setActiveRowIndex(i); setItemModalOpen(true); }}><Search size={14}/></button>
                    </td>
                    <td data-label="규격" className="p-1"><input className="form-input text-center text-xs p-1 h-8" value={row.spec} onChange={e => handleRowChange(i, 'spec', e.target.value)} /></td>
                    <td data-label="수량" className="p-1"><input className="form-input text-right text-xs p-1 h-8" type="number" value={row.qty} onChange={e => handleRowChange(i, 'qty', e.target.value)} /></td>
                    <td data-label="단가" className="p-1"><input className="form-input text-right text-xs p-1 h-8" type="number" value={row.price} onChange={e => handleRowChange(i, 'price', e.target.value)} /></td>
                    <td data-label="공급가액" className="p-1"><input className="form-input text-right text-xs p-1 h-8 bg-gray-100 font-bold text-primary" readOnly value={row.supply > 0 ? row.supply.toLocaleString() : ''} /></td>
                    <td data-label="세액" className="p-1"><input className="form-input text-right text-xs p-1 h-8 bg-gray-100 font-bold text-primary" readOnly value={row.tax > 0 ? row.tax.toLocaleString() : ''} /></td>
                    <td data-label="비고" className="p-1"><input className="form-input text-xs p-1 h-8" value={row.note} onChange={e => handleRowChange(i, 'note', e.target.value)} placeholder="비고 입력" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button className="btn text-xs" onClick={insertRow}><Plus size={14}/> 줄 추가</button>
            <button className="btn text-xs text-danger" onClick={removeRow}><Minus size={14}/> 줄 삭제</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 mt-6 p-2 bg-slate-100 rounded-lg border border-slate-300 gap-2">
             {['전잔금', '총합계', '입금', '총잔액', '인수자'].map((label, i) => {
                const keys = ['prev_balance', 'total_sum', 'deposit', 'total_balance', 'receiver'];
                const k = keys[i];
                return (
                  <div key={label} className="flex border-b sm:border-b-0 md:border-r border-slate-300 last:border-0 p-2">
                    <span className="self-center text-sm font-bold text-slate-700 w-16">{label}</span>
                    <input 
                      className={`form-input text-sm h-8 flex-1 ${k !== 'receiver' ? 'text-right font-bold' : ''}`}
                      style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
                      value={k !== 'receiver' && typeof footer[k] === 'number' ? footer[k].toLocaleString() : footer[k]}
                      onChange={e => setFooter({...footer, [k]: k !== 'receiver' ? parseFloat(e.target.value.replace(/,/g,'') || 0) : e.target.value })}
                      readOnly={k === 'total_sum' || k === 'total_balance'}
                    />
                  </div>
                )
             })}
          </div>
        </div>
      </div>

      <ClientModal 
        isOpen={isClientModalOpen} 
        onClose={() => setClientModalOpen(false)} 
        onSelect={(c) => { 
          setClientName(c.name); 
          setClientModalOpen(false); 
        }} 
      />

      <ItemModal 
        isOpen={isItemModalOpen} 
        onClose={() => setItemModalOpen(false)} 
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
  );
}
