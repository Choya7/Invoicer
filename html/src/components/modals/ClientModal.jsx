import React, { useState, useEffect } from 'react';
import { Search, X, Plus, Trash2 } from 'lucide-react';
import { getAllClients, addClient, deleteClients } from '../../core/database';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function ClientModal({ isOpen, onClose, onSelect }) {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
  }, [isOpen]);

  const loadClients = async () => {
    const data = await getAllClients();
    setClients(data);
  };

  const handleAddClient = async () => {
    const { value: formValues } = await MySwal.fire({
      title: '매출처 추가',
      html: `
        <div style="display: flex; flex-direction: column; gap: 10px; text-align: left;">
          <div><label class="form-label">상호(법인명)</label><input id="swal-name" class="form-input" /></div>
          <div><label class="form-label">사업자번호</label><input id="swal-biz" class="form-input" /></div>
          <div><label class="form-label">성명</label><input id="swal-owner" class="form-input" /></div>
          <div><label class="form-label">메모</label><input id="swal-memo" class="form-input" /></div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '저장',
      cancelButtonText: '취소',
      preConfirm: () => {
        const name = document.getElementById('swal-name').value;
        if (!name) {
          Swal.showValidationMessage('상호(법인명)를 입력해주세요.');
          return false;
        }
        return {
          name,
          biz_no: document.getElementById('swal-biz').value,
          owner: document.getElementById('swal-owner').value,
          memo: document.getElementById('swal-memo').value
        };
      }
    });

    if (formValues) {
      try {
        await addClient(formValues.name, formValues.biz_no, formValues.owner, formValues.memo);
        MySwal.fire('저장 완료', '성공적으로 추가되었습니다.', 'success');
        loadClients();
      } catch (error) {
        MySwal.fire('저장 실패', error.message || '데이터베이스 저장 중 오류가 발생했습니다.', 'error');
      }
    }
  };

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();
    const result = await MySwal.fire({
      title: '삭제 확인',
      text: `'${name}' 거래처를 삭제하시겠습니까? 관련 데이터에 영향이 있을 수 있습니다.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: '삭제',
      cancelButtonText: '취소'
    });

    if (result.isConfirmed) {
      try {
        await deleteClients([id]);
        MySwal.fire('삭제 완료', '삭제되었습니다.', 'success');
        loadClients();
      } catch (error) {
        MySwal.fire('삭제 실패', error.message || '오류가 발생했습니다.', 'error');
      }
    }
  };

  const filtered = clients.filter(c => 
    c.name.includes(search) || 
    c.biz_no.includes(search) || 
    c.owner.includes(search)
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
        {/* Header */}
        <div className="flex justify-between items-center p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h2 className="text-lg font-bold text-primary">매출처 선택</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--color-text-muted)"/></button>
        </div>
        
        {/* Body */}
        <div className="p-4 flex-col gap-4 flex flex-1" style={{ overflowY: 'auto' }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2" style={{ flex: 1, marginRight: '1rem' }}>
              <div className="form-input flex items-center gap-2" style={{ width: '100%' }}>
                <Search size={16} color="var(--color-text-muted)" />
                <input 
                  autoFocus
                  placeholder="상호, 사업자번호, 대표자명 검색..." 
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent' }}
                />
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleAddClient}>
              <Plus size={16} /> 추가
            </button>
          </div>

          <div className="table-container flex-1" style={{ overflowY: 'auto' }}>
            <table className="table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th style={{ width: '150px' }}>상호</th>
                  <th>사업자번호</th>
                  <th>성명</th>
                  <th>메모</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>삭제</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} 
                      onClick={() => onSelect(c)} 
                      style={{ cursor: 'pointer' }}
                      className="hover-bg"
                  >
                    <td className="font-semibold text-primary">{c.name}</td>
                    <td>{c.biz_no}</td>
                    <td>{c.owner}</td>
                    <td className="text-muted">{c.memo}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={(e) => handleDelete(e, c.id, c.name)}
                        className="btn-icon"
                        style={{ color: 'var(--color-danger)', background: 'none', border: 'none', padding: '4px', cursor: 'pointer' }}
                        title="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-6 text-muted">등록된 매출처가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 text-right text-sm text-muted" style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)' }}>
          총 {filtered.length}건
        </div>
      </div>
    </div>
  );
}
