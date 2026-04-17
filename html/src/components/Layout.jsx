import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { FileText, List, Settings, Menu, X } from 'lucide-react';

export default function Layout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on navigation (mobile)
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="layout-container">
      {/* Backdrop for Mobile */}
      <div 
        className={`backdrop ${isSidebarOpen ? 'show' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="flex items-center justify-between" style={{ padding: '1.5rem', borderBottom: '1px solid #1e293b' }}>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Settings size={24} color="#3b82f6" />
            INVOICER
          </h1>
          <button 
            className="md-grid-cols-2 p-1 hover:bg-slate-800 rounded md:hidden"
            onClick={() => setSidebarOpen(false)}
            style={{ display: isSidebarOpen ? 'block' : 'none' }}
          >
            <X size={20} />
          </button>
        </div>
        
        <nav style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <NavLink 
            to="/input" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <FileText size={20} /> 거래명세서 작성
          </NavLink>
          <NavLink 
            to="/list" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <List size={20} /> 거래명세서 목록 조회
          </NavLink>
        </nav>


        <div style={{ padding: '1.5rem', borderTop: '1px solid #1e293b', fontSize: '0.75rem', color: '#64748b' }}>
          Invoicer Revamp &copy; 2026
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col" style={{ background: '#f8fafc', overflowY: 'auto' }}>
        {/* Mobile Nav Toggle */}
        <div className="mobile-nav-toggle">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-md">
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-bold text-slate-800">INVOICER</h1>
        </div>

        <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

