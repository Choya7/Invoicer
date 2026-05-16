import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import InputPage from './pages/InputPage';
import ListPage from './pages/ListPage';
import LoginPage from './pages/LoginPage';
import PurchaseOrderInputPage from './pages/PurchaseOrderInputPage';
import PurchaseOrderStatusPage from './pages/PurchaseOrderStatusPage';
import FabricPage from './pages/FabricPage';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/input" replace />} />
          <Route path="input" element={<InputPage />} />
          <Route path="list" element={<ListPage />} />
          <Route path="purchase-order/input" element={<PurchaseOrderInputPage />} />
          <Route path="purchase-order/status" element={<PurchaseOrderStatusPage />} />
          <Route path="fabrics" element={<FabricPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
