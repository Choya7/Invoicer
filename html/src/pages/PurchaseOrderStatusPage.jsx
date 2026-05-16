import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Search, Printer, Trash2 } from 'lucide-react';
import { getAllPurchaseOrders, getAllClients, deletePurchaseOrders } from '../core/database';
import { exportInvoicesToExcel } from '../core/excelExport';
import PurchaseOrderModal from '../components/modals/PurchaseOrderModal';
import Swal from 'sweetalert2';

export default function PurchaseOrderStatusPage() {
  const [activeTab, setActiveTab] = useState('client'); 

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingPO, setEditingPO] = useState(null);
  
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date(); d.setMonth(0); d.setDate(1); return d; // Jan 1st of current year
  });
  const [periodEnd, setPeriodEnd] = useState(new Date());

  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const pos = await getAllPurchaseOrders();
    const cl = await getAllClients();
    setPurchaseOrders(pos);
    setClients(cl);
  };

  const calculateSum = (data) => {
    let tSupply = 0, tTax = 0;
    data.forEach(po => {
      po.data.items.forEach(it => {
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
    const currentIds = currentList.map(po => po.id);
    const allSelected = currentIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !currentIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...currentIds])]);
    }
  };

  const handleRowDoubleClick = (po) => {
    setEditingPO(po);
    setEditModalOpen(true);
  };

  const handleSelectedDelete = async () => {
    if (selectedIds.length === 0) {
      Swal.fire('알림', '삭제할 항목을 선택해주세요.', 'info');
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: '삭제 확인',
      text: `선택하신 ${selectedIds.length}개의 발주서를 삭제하시겠습니까?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      confirmButtonColor: 'var(--color-danger)'
    });

    if (isConfirmed) {
      await deletePurchaseOrders(selectedIds);
      setSelectedIds([]);
      await loadData();
      Swal.fire('삭제 완료', '선택하신 항목이 삭제되었습니다.', 'success');
    }
  };

  const handleSelectedPrint = (currentList, mode) => {
    const filteredToPrint = currentList.filter(po => selectedIds.includes(po.id));
    if (filteredToPrint.length === 0) {
      Swal.fire('알림', '인쇄할 항목을 선택해주세요.', 'info');
      return;
    }

    const periodStr = `${periodStart.toISOString().split('T')[0]} ~ ${periodEnd.toISOString().split('T')[0]}`;
    exportInvoicesToExcel(filteredToPrint, periodStr, mode, '발주서');
    Swal.fire('엑셀 전송 완료', `선택하신 발주서들이 [${mode === 'detail' ? '상세' : '요약'}] 파일로 생성되었습니다.`, 'success');
  };

  const renderClientTab = () => {
    const filteredClients = clients.filter(c => c.name.includes(clientSearch) || (c.biz_no && c.biz_no.includes(clientSearch)));
    
    let filteredPOs = [];
    if (selectedClient) {
       filteredPOs = purchaseOrders.filter(po => {
         const poDate = po.issue_date; // YYYY-MM-DD
         const sDate = periodStart.toISOString().split('T')[0];
         const eDate = periodEnd.toISOString().split('T')[0];
         return po.client_name === selectedClient.name && poDate >= sDate && poDate <= eDate;
       });
    }
    const tot = calculateSum(filteredPOs);
    const isAllSelected = filteredPOs.length > 0 && filteredPOs.every(po => selectedIds.includes(po.id));

    return (
      <div className="flex-responsive gap-4" style={{ height: 'auto', minHeight: 'calc(100vh - 200px)' }}>
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
                          background: isSelected ? '#ecfdf5' : 'transparent',
                          borderLeft: isSelected ? '4px solid #10b981' : '4px solid transparent',
                          transition: 'all 0.2s ease'
                        }}
                    >
                      <td className={`font-semibold ${isSelected ? 'text-emerald-600' : 'text-slate-700'}`}>{c.name}</td>
                      <td className="text-xs">{c.biz_no}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card flex-1 flex flex-col mobile-full">
          <div className="p-4 border-b border-gray-200 flex-responsive justify-between items-center bg-gray-50 rounded-t-lg gap-4">
            <div className="flex items-center gap-4">
              <div className="font-bold text-lg text-emerald-600">
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
                    <input type="checkbox" checked={isAllSelected} onChange={() => toggleSelectAll(filteredPOs)} />
                  </th>
                  <th className="text-center">발주날짜</th>
                  <th>품목개요</th>
                  <th className="text-center">작업현황</th>
                  <th className="text-right">발주금액</th>
                  <th className="text-right">공급가액</th>
                  <th className="text-right">세액</th>
                </tr>
              </thead>
              <tbody>
                {filteredPOs.map((po, i) => {
                  const items = po.data.items;
                  const firstItem = items[0]?.name || '품목';
                  const summary = items.length > 1 ? `${firstItem} 외 ${items.length - 1}건` : firstItem;
                  
                  let supply = 0, tax = 0;
                  items.forEach(it => { supply += (it.supply || 0); tax += (it.tax || 0); });
                  
                  return (
                    <tr key={po.id} className={`hover-bg ${selectedIds.includes(po.id) ? 'bg-emerald-50' : ''}`} 
                        onClick={() => toggleSelect(po.id)}
                        onDoubleClick={() => handleRowDoubleClick(po)}
                        title="더블 클릭하여 상세 수정"
                    >
                      <td data-label="선택" className="text-center" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.includes(po.id)} onChange={() => toggleSelect(po.id)} />
                      </td>
                      <td data-label="발주날짜" className="text-center text-sm">{po.issue_date}</td>
                      <td data-label="품목개요" className="font-semibold text-sm">{summary}</td>
                      <td data-label="작업현황" className="text-center">
                        <div className="flex flex-col gap-1 items-center">
                          <span className="text-xs font-semibold">
                            {items.reduce((acc, it) => acc + (it.completed_qty || 0), 0).toLocaleString()} / {items.reduce((acc, it) => acc + (it.qty || 0), 0).toLocaleString()}
                          </span>
                          <div style={{ width: '60px', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ 
                              width: `${Math.min(100, (items.reduce((acc, it) => acc + (it.completed_qty || 0), 0) / (items.reduce((acc, it) => acc + (it.qty || 0), 0) || 1)) * 100)}%`, 
                              height: '100%', 
                              background: '#10b981' 
                            }}></div>
                          </div>
                        </div>
                      </td>
                      <td data-label="발주금액" className="text-right font-bold text-emerald-600 text-sm">{(supply + tax).toLocaleString()}</td>
                      <td data-label="공급가액" className="text-right text-sm">{supply.toLocaleString()}</td>
                      <td data-label="세액" className="text-right text-sm">{tax.toLocaleString()}</td>
                    </tr>
                  );
                })}
                {filteredPOs.length === 0 && (
                  <tr><td colSpan={6} className="text-center p-8 text-muted">내역이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-200 bg-gray-50 mt-auto rounded-b-lg flex-responsive justify-between items-center gap-4">
             <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <button className="btn" onClick={() => handleSelectedPrint(filteredPOs, 'summary')}><Printer size={16}/> 선택 요약</button>
                <button className="btn" onClick={() => handleSelectedPrint(filteredPOs, 'detail')}><Printer size={16}/> 선택 상세</button>
                <button className="btn text-danger" onClick={handleSelectedDelete}><Trash2 size={16}/> 삭제</button>
                {selectedIds.length > 0 && <span className="self-center text-xs font-bold text-emerald-600 ml-2">{selectedIds.length}개 선택됨</span>}
             </div>
             <div className="text-sm font-bold text-slate-800 text-center md:text-right">발주 합계금액 : <span className="text-emerald-600 text-xl">{tot.toLocaleString()}</span> 원</div>
          </div>
        </div>
      </div>
    );
  };

  const renderPeriodTab = () => {
    const filteredPOs = purchaseOrders.filter(po => {
      const poDate = po.issue_date; // YYYY-MM-DD
      const sDate = periodStart.toISOString().split('T')[0];
      const eDate = periodEnd.toISOString().split('T')[0];
      return poDate >= sDate && poDate <= eDate;
    });
    const tot = calculateSum(filteredPOs);
    const isAllSelected = filteredPOs.length > 0 && filteredPOs.every(po => selectedIds.includes(po.id));

    return (
      <div className="card flex flex-col" style={{ height: 'auto', minHeight: 'calc(100vh - 200px)' }}>
          <div className="p-4 border-b border-gray-200 flex-responsive justify-between items-center bg-gray-50 rounded-t-lg gap-4">
            <div className="flex items-center gap-4">
              <div className="font-bold text-lg text-emerald-600">기간별 발주 내역</div>
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
                    <input type="checkbox" checked={isAllSelected} onChange={() => toggleSelectAll(filteredPOs)} />
                  </th>
                  <th className="text-center">발주날짜</th>
                  <th>거래처명</th>
                  <th>품목개요</th>
                  <th className="text-center">작업현황</th>
                  <th className="text-right">합계금액</th>
                </tr>
              </thead>
              <tbody>
                {filteredPOs.map((po, i) => {
                  const items = po.data.items;
                  const firstItem = items[0]?.name || '품목';
                  const summary = items.length > 1 ? `${firstItem} 외 ${items.length - 1}건` : firstItem;
                  const total = po.grandTotal || 0;
                  
                  return (
                    <tr key={po.id} className={`hover-bg ${selectedIds.includes(po.id) ? 'bg-emerald-50' : ''}`} 
                        onClick={() => toggleSelect(po.id)}
                        onDoubleClick={() => handleRowDoubleClick(po)}
                    >
                      <td data-label="선택" className="text-center" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.includes(po.id)} onChange={() => toggleSelect(po.id)} />
                      </td>
                      <td data-label="발주날짜" className="text-center text-sm">{po.issue_date}</td>
                      <td data-label="거래처명" className="font-semibold text-sm">{po.client_name}</td>
                      <td data-label="품목개요" className="text-sm">{summary}</td>
                      <td data-label="작업현황" className="text-center">
                        <div className="flex flex-col gap-1 items-center">
                          <span className="text-xs font-semibold">
                            {items.reduce((acc, it) => acc + (it.completed_qty || 0), 0).toLocaleString()} / {items.reduce((acc, it) => acc + (it.qty || 0), 0).toLocaleString()}
                          </span>
                          <div style={{ width: '60px', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ 
                              width: `${Math.min(100, (items.reduce((acc, it) => acc + (it.completed_qty || 0), 0) / (items.reduce((acc, it) => acc + (it.qty || 0), 0) || 1)) * 100)}%`, 
                              height: '100%', 
                              background: '#10b981' 
                            }}></div>
                          </div>
                        </div>
                      </td>
                      <td data-label="합계금액" className="text-right font-bold text-emerald-600 text-sm">{total.toLocaleString()}</td>
                    </tr>
                  );
                })}
                {filteredPOs.length === 0 && (
                  <tr><td colSpan={5} className="text-center p-8 text-muted">해당 기간의 발주 내역이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-200 bg-gray-50 mt-auto rounded-b-lg flex-responsive justify-between items-center gap-4">
             <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <button className="btn" onClick={() => handleSelectedPrint(filteredPOs, 'summary')}><Printer size={16}/> 선택 요약</button>
                <button className="btn" onClick={() => handleSelectedPrint(filteredPOs, 'detail')}><Printer size={16}/> 선택 상세</button>
                <button className="btn text-danger" onClick={handleSelectedDelete}><Trash2 size={16}/> 삭제</button>
                {selectedIds.length > 0 && <span className="self-center text-xs font-bold text-emerald-600 ml-2">{selectedIds.length}개 선택됨</span>}
             </div>
             <div className="text-sm font-bold text-slate-800 text-center md:text-right">기간 총 합계 : <span className="text-emerald-600 text-xl">{tot.toLocaleString()}</span> 원</div>
          </div>
      </div>
    );
  };

  return (
    <div className="flex-col gap-4 h-full">
      <div className="flex gap-4 mb-6">
        <button 
          className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'period' ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-muted border border-gray-300'}`}
          onClick={() => { setActiveTab('period'); setSelectedIds([]); }}
        >
          기간으로 조회
        </button>
        <button 
          className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'client' ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-muted border border-gray-300'}`}
          onClick={() => { setActiveTab('client'); setSelectedIds([]); }}
        >
          거래처별 조회
        </button>
      </div>

      {activeTab === 'client' ? renderClientTab() : renderPeriodTab()}

      <PurchaseOrderModal 
        isOpen={isEditModalOpen} 
        onClose={() => setEditModalOpen(false)} 
        po={editingPO}
        onSaved={loadData}
      />
    </div>
  );
}
