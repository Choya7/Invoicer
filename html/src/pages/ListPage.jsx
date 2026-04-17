import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Search, Printer, Trash2, CheckCircle, CheckCircle2 } from 'lucide-react';
import { getAllInvoices, getAllClients, deleteInvoices } from '../core/database';
import { exportInvoicesToExcel } from '../core/excelExport';
import InvoiceModal from '../components/modals/InvoiceModal';
import Swal from 'sweetalert2';

export default function ListPage() {
  const [activeTab, setActiveTab] = useState('client'); // period or client

  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Edit logic
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  
  // Period Tab state
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d;
  });
  const [periodEnd, setPeriodEnd] = useState(new Date());

  // Client Tab state
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const inv = await getAllInvoices();
    const cl = await getAllClients();
    setInvoices(inv);
    setClients(cl);
  };

  const calculateSum = (data) => {
    let tSupply = 0, tTax = 0;
    data.forEach(inv => {
      inv.data.items.forEach(it => {
        tSupply += (it.supply || 0);
        tTax += (it.tax || 0);
      });
    });
    return tSupply + tTax;
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = (currentList) => {
    const currentIds = currentList.map(inv => inv.id);
    const allSelected = currentIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !currentIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...currentIds])]);
    }
  };

  const handleRowDoubleClick = (inv) => {
    setEditingInvoice(inv);
    setEditModalOpen(true);
  };

  const handleSelectedDelete = async () => {
    if (selectedIds.length === 0) {
      Swal.fire('알림', '삭제할 항목을 선택해주세요.', 'info');
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: '삭제 확인',
      text: `선택하신 ${selectedIds.length}개의 명세서를 삭제하시겠습니까?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      confirmButtonColor: 'var(--color-danger)'
    });

    if (isConfirmed) {
      await deleteInvoices(selectedIds);
      setSelectedIds([]);
      await loadData();
      Swal.fire('삭제 완료', '선택하신 항목이 삭제되었습니다.', 'success');
    }
  };

  const handleSelectedPrint = (currentList, mode) => {
    const filteredToPrint = currentList.filter(inv => selectedIds.includes(inv.id));
    if (filteredToPrint.length === 0) {
      Swal.fire('알림', '인쇄할 항목을 선택해주세요.', 'info');
      return;
    }

    const periodStr = `${periodStart.toISOString().split('T')[0]} ~ ${periodEnd.toISOString().split('T')[0]}`;
    exportInvoicesToExcel(filteredToPrint, periodStr, mode);
    Swal.fire('엑셀 전송 완료', `선택하신 명세서들이 [${mode === 'detail' ? '상세' : '요약'}] 파일로 생성되었습니다.`, 'success');
  };

  const renderClientTab = () => {
    const filteredClients = clients.filter(c => c.name.includes(clientSearch) || (c.biz_no && c.biz_no.includes(clientSearch)));
    
    let filteredInvoices = [];
    if (selectedClient) {
       filteredInvoices = invoices.filter(inv => {
         const d = new Date(inv.issue_date);
         return inv.client_name === selectedClient.name && d >= periodStart && d <= periodEnd;
       });
    }
    const tot = calculateSum(filteredInvoices);
    const isAllSelected = filteredInvoices.length > 0 && filteredInvoices.every(inv => selectedIds.includes(inv.id));

    return (
      <div className="flex-responsive gap-4" style={{ height: 'auto', minHeight: 'calc(100vh - 200px)' }}>
        {/* Left Side: Client List */}
        <div className="card flex flex-col mobile-full mobile-no-max-width" style={{ width: '300px' }}>
          <div className="p-4 border-b border-gray-200">
            <div className="form-input flex items-center gap-2 mb-2">
              <Search size={16} className="text-muted"/>
              <input 
                placeholder="상호, 사업자번호 검색..." className="flex-1"
                style={{ border: 'none', background: 'transparent', outline: 'none' }}
                value={clientSearch} onChange={e => setClientSearch(e.target.value)}
              />
            </div>
            <div className="text-right text-xs text-muted">총 {filteredClients.length}건</div>
          </div>
          <div className="flex-1 overflow-auto table-container" style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}>
            <table className="table">
              <thead className="sticky top-0 z-10">
                <tr><th>상호</th><th>사업자번호</th></tr>
              </thead>
              <tbody>
                {filteredClients.map(c => {
                  const isSelected = selectedClient?.id === c.id;
                  return (
                    <tr key={c.id} 
                        onClick={() => setSelectedClient(c)}
                        className={`cursor-pointer ${isSelected ? 'selected-item' : 'hover-bg'}`}
                        style={{ 
                          background: isSelected ? '#eff6ff' : 'transparent',
                          borderLeft: isSelected ? '4px solid var(--color-primary)' : '4px solid transparent',
                          transition: 'all 0.2s ease'
                        }}
                    >
                      <td className={`font-semibold ${isSelected ? 'text-primary' : 'text-slate-700'}`}>{c.name}</td>
                      <td className="text-xs">{c.biz_no}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Invoice List */}
        <div className="card flex-1 flex flex-col mobile-full">
          <div className="p-4 border-b border-gray-200 flex-responsive justify-between items-center bg-gray-50 rounded-t-lg gap-4">
            <div className="flex items-center gap-4">
              <div className="font-bold text-lg text-primary">
                {selectedClient ? selectedClient.name : '거래처를 선택하세요'}
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <DatePicker selected={periodStart} onChange={setPeriodStart} dateFormat="yyyy-MM-dd" className="form-input text-sm w-28" />
              <span className="text-muted">~</span>
              <DatePicker selected={periodEnd} onChange={setPeriodEnd} dateFormat="yyyy-MM-dd" className="form-input text-sm w-28" />
            </div>
          </div>
          
          <div className="flex-1 overflow-auto table-container" style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}>
            <table className="table table-responsive">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th style={{ width: '40px' }} className="text-center">
                    <input type="checkbox" checked={isAllSelected} onChange={() => toggleSelectAll(filteredInvoices)} />
                  </th>
                  <th className="text-center">발행일자</th>
                  <th>품목개요</th>
                  <th className="text-right">합계금액</th>
                  <th className="text-right">공급가액</th>
                  <th className="text-right">세액</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv, i) => {
                  const items = inv.data.items;
                  const firstItem = items[0]?.name || '품목';
                  const summary = items.length > 1 ? `${firstItem} 외 ${items.length - 1}건` : firstItem;
                  
                  let supply = 0, tax = 0;
                  items.forEach(it => { supply += (it.supply || 0); tax += (it.tax || 0); });
                  
                  return (
                    <tr key={inv.id} className={`hover-bg ${selectedIds.includes(inv.id) ? 'bg-orange-50' : ''}`} 
                        onClick={() => toggleSelect(inv.id)}
                        onDoubleClick={() => handleRowDoubleClick(inv)}
                        title="더블 클릭하여 상세 수정"
                    >
                      <td data-label="선택" className="text-center" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.includes(inv.id)} onChange={() => toggleSelect(inv.id)} />
                      </td>
                      <td data-label="발행일자" className="text-center text-sm">{inv.issue_date}</td>
                      <td data-label="품목개요" className="font-semibold text-sm">{summary}</td>
                      <td data-label="합계금액" className="text-right font-bold text-primary text-sm">{(supply + tax).toLocaleString()}</td>
                      <td data-label="공급가액" className="text-right text-sm">{supply.toLocaleString()}</td>
                      <td data-label="세액" className="text-right text-sm">{tax.toLocaleString()}</td>
                    </tr>
                  );
                })}
                {filteredInvoices.length === 0 && (
                  <tr><td colSpan={6} className="text-center p-8 text-muted">내역이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-200 bg-gray-50 mt-auto rounded-b-lg flex-responsive justify-between items-center gap-4">
             <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <button className="btn" onClick={() => handleSelectedPrint(filteredInvoices, 'summary')}><Printer size={16}/> 선택 요약</button>
                <button className="btn" onClick={() => handleSelectedPrint(filteredInvoices, 'detail')}><Printer size={16}/> 선택 상세</button>
                <button className="btn text-danger" onClick={handleSelectedDelete}><Trash2 size={16}/> 삭제</button>
                {selectedIds.length > 0 && <span className="self-center text-xs font-bold text-orange-600 ml-2">{selectedIds.length}개 선택됨</span>}
             </div>
             <div className="text-sm font-bold text-slate-800 text-center md:text-right">합계금액 : <span className="text-danger text-xl">{tot.toLocaleString()}</span> 원</div>
          </div>
        </div>
      </div>
    );
  };

  const renderPeriodTab = () => {
    const filteredInvoices = invoices.filter(inv => {
      const d = new Date(inv.issue_date);
      return d >= periodStart && d <= periodEnd;
    });
    const tot = calculateSum(filteredInvoices);
    const isAllSelected = filteredInvoices.length > 0 && filteredInvoices.every(inv => selectedIds.includes(inv.id));

    return (
      <div className="card flex flex-col" style={{ height: 'auto', minHeight: 'calc(100vh - 200px)' }}>
          <div className="p-4 border-b border-gray-200 flex-responsive justify-between items-center bg-gray-50 rounded-t-lg gap-4">
            <div className="flex items-center gap-4">
              <div className="font-bold text-lg text-primary">기간별 전체 내역</div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <DatePicker selected={periodStart} onChange={setPeriodStart} dateFormat="yyyy-MM-dd" className="form-input text-sm w-28" />
              <span className="text-muted">~</span>
              <DatePicker selected={periodEnd} onChange={setPeriodEnd} dateFormat="yyyy-MM-dd" className="form-input text-sm w-28" />
            </div>
          </div>
          
          <div className="flex-1 overflow-auto table-container" style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}>
            <table className="table table-responsive">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th style={{ width: '40px' }} className="text-center">
                    <input type="checkbox" checked={isAllSelected} onChange={() => toggleSelectAll(filteredInvoices)} />
                  </th>
                  <th className="text-center">발행일자</th>
                  <th>거래처명</th>
                  <th>품목개요</th>
                  <th className="text-right">합계금액</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv, i) => {
                  const items = inv.data.items;
                  const firstItem = items[0]?.name || '품목';
                  const summary = items.length > 1 ? `${firstItem} 외 ${items.length - 1}건` : firstItem;
                  const total = inv.grandTotal || 0;
                  
                  return (
                    <tr key={inv.id} className={`hover-bg ${selectedIds.includes(inv.id) ? 'bg-orange-50' : ''}`} 
                        onClick={() => toggleSelect(inv.id)}
                        onDoubleClick={() => handleRowDoubleClick(inv)}
                    >
                      <td data-label="선택" className="text-center" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.includes(inv.id)} onChange={() => toggleSelect(inv.id)} />
                      </td>
                      <td data-label="발행일자" className="text-center text-sm">{inv.issue_date}</td>
                      <td data-label="거래처명" className="font-semibold text-sm">{inv.client_name}</td>
                      <td data-label="품목개요" className="text-sm">{summary}</td>
                      <td data-label="합계금액" className="text-right font-bold text-primary text-sm">{total.toLocaleString()}</td>
                    </tr>
                  );
                })}
                {filteredInvoices.length === 0 && (
                  <tr><td colSpan={5} className="text-center p-8 text-muted">해당 기간의 내역이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-200 bg-gray-50 mt-auto rounded-b-lg flex-responsive justify-between items-center gap-4">
             <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <button className="btn" onClick={() => handleSelectedPrint(filteredInvoices, 'summary')}><Printer size={16}/> 선택 요약</button>
                <button className="btn" onClick={() => handleSelectedPrint(filteredInvoices, 'detail')}><Printer size={16}/> 선택 상세</button>
                <button className="btn text-danger" onClick={handleSelectedDelete}><Trash2 size={16}/> 삭제</button>
                {selectedIds.length > 0 && <span className="self-center text-xs font-bold text-orange-600 ml-2">{selectedIds.length}개 선택됨</span>}
             </div>
             <div className="text-sm font-bold text-slate-800 text-center md:text-right">기간 총 합계 : <span className="text-danger text-xl">{tot.toLocaleString()}</span> 원</div>
          </div>
      </div>
    );
  };

  return (
    <div className="flex-col gap-4 h-full">
      <div className="flex gap-4 mb-6">
        <button 
          className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'period' ? 'bg-primary text-white shadow-md' : 'bg-white text-muted border border-gray-300'}`}
          onClick={() => { setActiveTab('period'); setSelectedIds([]); }}
        >
          기간으로 조회
        </button>
        <button 
          className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'client' ? 'bg-primary text-white shadow-md' : 'bg-white text-muted border border-gray-300'}`}
          onClick={() => { setActiveTab('client'); setSelectedIds([]); }}
        >
          매출처별 조회
        </button>
      </div>

      {activeTab === 'client' ? renderClientTab() : renderPeriodTab()}

      <InvoiceModal 
        isOpen={isEditModalOpen} 
        onClose={() => setEditModalOpen(false)} 
        invoice={editingInvoice}
        onSaved={loadData}
      />
    </div>
  );
}
