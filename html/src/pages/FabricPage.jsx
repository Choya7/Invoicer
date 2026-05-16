import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Package, ArrowUpRight, ArrowDownLeft, RotateCcw } from 'lucide-react';
import { getAllFabrics, saveFabric, updateFabric, deleteFabrics } from '../core/database';
import Swal from 'sweetalert2';

export default function FabricPage() {
  const [fabrics, setFabrics] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentFabric, setCurrentFabric] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '', name: '', supplier: '', color: '', unit: 'yd', stock: 0, memo: ''
  });

  useEffect(() => {
    loadFabrics();
  }, []);

  const loadFabrics = async () => {
    const data = await getAllFabrics();
    setFabrics(data);
  };

  const filteredFabrics = fabrics.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.supplier && f.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenModal = (fabric = null) => {
    if (fabric) {
      setCurrentFabric(fabric);
      setFormData({
        code: fabric.code,
        name: fabric.name,
        supplier: fabric.supplier || '',
        color: fabric.color || '',
        unit: fabric.unit || 'yd',
        stock: fabric.stock || 0,
        memo: fabric.memo || ''
      });
    } else {
      setCurrentFabric(null);
      setFormData({
        code: '', name: '', supplier: '', color: '', unit: 'yd', stock: 0, memo: ''
      });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name) {
      Swal.fire('알림', '코드와 품명은 필수입니다.', 'warning');
      return;
    }

    try {
      if (currentFabric) {
        await updateFabric(currentFabric.id, formData);
        Swal.fire('수정 완료', '원단 정보가 수정되었습니다.', 'success');
      } else {
        await saveFabric(formData);
        Swal.fire('등록 완료', '신규 원단이 등록되었습니다.', 'success');
      }
      setModalOpen(false);
      loadFabrics();
    } catch (err) {
      Swal.fire('오류', err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: '삭제 확인',
      text: '정말 삭제하시겠습니까?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      confirmButtonColor: '#ef4444'
    });

    if (isConfirmed) {
      await deleteFabrics([id]);
      loadFabrics();
      Swal.fire('삭제 완료', '삭제되었습니다.', 'success');
    }
  };

  const handleStockAdjust = async (fabric, type) => {
    const { value: amount } = await Swal.fire({
      title: type === 'in' ? '입고 관리' : '출고 관리',
      input: 'number',
      inputLabel: `${fabric.name} (${fabric.color}) ${type === 'in' ? '입고' : '출고'}량을 입력하세요.`,
      inputPlaceholder: '수량 입력',
      showCancelButton: true,
      confirmButtonText: '확인',
      cancelButtonText: '취소'
    });

    if (amount) {
      const newStock = type === 'in' 
        ? (fabric.stock || 0) + parseFloat(amount)
        : (fabric.stock || 0) - parseFloat(amount);
      
      await updateFabric(fabric.id, { ...fabric, stock: newStock });
      loadFabrics();
      Swal.fire('완료', '재고가 반영되었습니다.', 'success');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Package className="text-blue-500" /> 원단 및 재고 관리
        </h2>
        <button className="btn btn-primary bg-blue-600 border-blue-600 flex items-center gap-2" onClick={() => handleOpenModal()}>
          <Plus size={18} /> 신규 원단 등록
        </button>
      </div>

      <div className="card p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="form-input flex items-center gap-2 flex-1">
          <Search size={18} className="text-muted" />
          <input 
            placeholder="원단명, 코드, 거래처 검색..." 
            className="flex-1 outline-none border-none bg-transparent"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn flex items-center gap-2" onClick={loadFabrics}>
          <RotateCcw size={16} /> 새로고침
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredFabrics.map(f => (
          <div key={f.id} className="card p-5 hover:shadow-lg transition-shadow border-t-4 border-blue-500 relative group">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{f.code}</span>
                <h3 className="text-lg font-bold text-slate-800 mt-1">{f.name}</h3>
                <p className="text-sm text-muted">{f.supplier || '거래처 미지정'} / {f.color || '색상 미지정'}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1 hover:bg-slate-100 rounded text-slate-600" onClick={() => handleOpenModal(f)}><Edit size={16}/></button>
                <button className="p-1 hover:bg-red-50 rounded text-red-500" onClick={() => handleDelete(f.id)}><Trash2 size={16}/></button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 flex justify-between items-center mb-4">
              <div>
                <p className="text-xs text-muted">현재고</p>
                <p className="text-xl font-black text-slate-800">{(f.stock || 0).toLocaleString()} <span className="text-xs font-normal text-muted">{f.unit}</span></p>
              </div>
              <div className="flex gap-2">
                <button 
                  className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200 transition-colors"
                  title="입고"
                  onClick={() => handleStockAdjust(f, 'in')}
                >
                  <ArrowDownLeft size={20} />
                </button>
                <button 
                  className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200 transition-colors"
                  title="출고"
                  onClick={() => handleStockAdjust(f, 'out')}
                >
                  <ArrowUpRight size={20} />
                </button>
              </div>
            </div>

            {f.memo && (
              <div className="text-xs text-muted border-t pt-2 mt-2 italic">
                {f.memo}
              </div>
            )}
          </div>
        ))}
        {filteredFabrics.length === 0 && (
          <div className="col-span-full py-20 text-center card bg-slate-50 text-muted">
            <Package size={48} className="mx-auto mb-4 opacity-20" />
            조회된 원단 내역이 없습니다.
          </div>
        )}
      </div>

      {/* Fabric Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h2 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">
              {currentFabric ? '원단 정보 수정' : '신규 원단 등록'}
            </h2>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600 ml-1">원단코드 *</label>
                  <input 
                    className="form-input" 
                    value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value})} 
                    placeholder="예: FB-001"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600 ml-1">원단명 *</label>
                  <input 
                    className="form-input" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="예: 고밀도 면"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600 ml-1">거래처</label>
                  <input 
                    className="form-input" 
                    value={formData.supplier} 
                    onChange={e => setFormData({...formData, supplier: e.target.value})} 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600 ml-1">색상</label>
                  <input 
                    className="form-input" 
                    value={formData.color} 
                    onChange={e => setFormData({...formData, color: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600 ml-1">단위</label>
                  <select 
                    className="form-input" 
                    value={formData.unit} 
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                  >
                    <option value="yd">yd (야드)</option>
                    <option value="mt">mt (미터)</option>
                    <option value="kg">kg (킬로그램)</option>
                    <option value="ea">ea (개)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600 ml-1">초기재고</label>
                  <input 
                    className="form-input" 
                    type="number"
                    value={formData.stock} 
                    onChange={e => setFormData({...formData, stock: e.target.value})} 
                    disabled={!!currentFabric}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600 ml-1">비고 / 메모</label>
                <textarea 
                  className="form-input min-h-[100px] py-2" 
                  value={formData.memo} 
                  onChange={e => setFormData({...formData, memo: e.target.value})} 
                />
              </div>
            </div>
            <div className="flex gap-2 mt-8">
              <button className="btn flex-1" onClick={() => setModalOpen(false)}>취소</button>
              <button className="btn btn-primary flex-1 bg-blue-600 border-blue-600" onClick={handleSave}>
                {currentFabric ? '수정하기' : '등록하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
