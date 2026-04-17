import React, { useState, useEffect } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { getAllItems, addItem } from '../../core/database';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function ItemModal({ isOpen, onClose, onSelect }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadItems();
    }
  }, [isOpen]);

  const loadItems = async () => {
    const data = await getAllItems();
    setItems(data);
  };

  const handleAddItem = async () => {
    const { value: formValues } = await MySwal.fire({
      title: '물품 추가',
      html: `
        <div style="display: flex; flex-direction: column; gap: 10px; text-align: left;">
          <div><label class="form-label">물품코드</label><input id="swal-code" class="form-input" /></div>
          <div><label class="form-label">물품명</label><input id="swal-name" class="form-input" /></div>
          <div><label class="form-label">규격</label><input id="swal-spec" class="form-input" /></div>
          <div><label class="form-label">판매가격</label><input id="swal-price" type="number" class="form-input" value="0"/></div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '저장',
      cancelButtonText: '취소',
      preConfirm: () => {
        const name = document.getElementById('swal-name').value;
        const price = parseInt(document.getElementById('swal-price').value || '0', 10);
        if (!name) {
          Swal.showValidationMessage('물품명을 입력해주세요.');
          return false;
        }
        return {
          code: document.getElementById('swal-code').value,
          name,
          spec: document.getElementById('swal-spec').value,
          price
        };
      }
    });

    if (formValues) {
      try {
        await addItem(formValues.code, formValues.name, formValues.spec, formValues.price);
        MySwal.fire('저장 완료', '성공적으로 추가되었습니다.', 'success');
        loadItems();
      } catch (error) {
        MySwal.fire('저장 실패', error.message || '데이터베이스 저장 중 오류가 발생했습니다.', 'error');
      }
    }
  };

  const filtered = items.filter(c => 
    c.name.includes(search) || 
    c.code.includes(search)
  );

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="card" style={{
        width: '600px', maxWidth: '90vw', maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        <div className="flex justify-between items-center p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h2 className="text-lg font-bold text-primary">물품 선택</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--color-text-muted)"/></button>
        </div>
        
        <div className="p-4 flex-col gap-4 flex flex-1" style={{ overflowY: 'auto' }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2" style={{ flex: 1, marginRight: '1rem' }}>
              <div className="form-input flex items-center gap-2" style={{ width: '100%' }}>
                <Search size={16} color="var(--color-text-muted)" />
                <input 
                  autoFocus
                  placeholder="물품명, 코드 검색..." 
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent' }}
                />
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleAddItem}>
              <Plus size={16} /> 추가
            </button>
          </div>

          <div className="table-container flex-1" style={{ overflowY: 'auto' }}>
            <table className="table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th>물품코드</th>
                  <th style={{ width: '200px' }}>물품명</th>
                  <th>규격</th>
                  <th className="text-right">판매가격</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} 
                      onClick={() => onSelect(c)} 
                      style={{ cursor: 'pointer' }}
                      className="hover-bg"
                  >
                    <td className="text-muted">{c.code}</td>
                    <td className="font-semibold text-primary">{c.name}</td>
                    <td>{c.spec}</td>
                    <td className="text-right font-bold">{c.price.toLocaleString()} 원</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center p-6 text-muted">등록된 물품이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="p-4 text-right text-sm text-muted" style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)' }}>
          총 {filtered.length}건
        </div>
      </div>
    </div>
  );
}
