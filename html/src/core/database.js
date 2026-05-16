const API_BASE_URL = import.meta.env.PROD
  ? '/api' 
  : `http://${window.location.hostname}:5000/api`;

const handleResponse = async (response) => {
  if (response.status === 401 || response.status === 403) {
    // Token expired or invalid
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Server Error');
  }
  return response.json();
};

const authenticatedFetch = (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
    'Authorization': token ? `Bearer ${token}` : '',
  };
  return fetch(url, { ...options, headers });
};

// Invoices
export const getAllInvoices = async () => {
  const res = await authenticatedFetch(`${API_BASE_URL}/invoices`);
  const data = await handleResponse(res);
  // Transform backend format to match frontend expectation if needed
  return data.map(inv => ({
    ...inv,
    issue_date: inv.issueDate.split('T')[0], // Convert ISO to YYYY-MM-DD
    client_name: inv.clientName,
    data: {
      supplier: inv.supplier,
      items: inv.items,
      footer: inv.footer,
      grand_total: inv.grandTotal
    }
  }));
};

export const generateFormattedId = (date, clientName) => {
  const cleanClient = clientName.replace(/[^a-zA-Z0-9가-힣]/g, '').substring(0, 10);
  const random = Math.random().toString(36).substring(2, 10);
  return `${date}_${cleanClient}_${random}`;
};

export const saveInvoice = async (issue_date, client_name, invoice_data, custom_id = null) => {
  const res = await authenticatedFetch(`${API_BASE_URL}/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: custom_id,
      issue_date,
      client_name,
      data: invoice_data
    })
  });
  const data = await handleResponse(res);
  return data.id;
};

export const updateInvoice = async (id, issue_date, client_name, invoice_data) => {
  const res = await authenticatedFetch(`${API_BASE_URL}/invoices/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      issue_date,
      client_name,
      data: invoice_data
    })
  });
  return handleResponse(res);
};

export const deleteInvoices = async (ids) => {
  const res = await authenticatedFetch(`${API_BASE_URL}/invoices`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  });
  return handleResponse(res);
};

// Clients
export const getAllClients = async () => {
  const res = await authenticatedFetch(`${API_BASE_URL}/clients`);
  const data = await handleResponse(res);
  return data.map(c => ({
    ...c,
    biz_no: c.bizNo || ''
  }));
};

export const addClient = async (name, biz_no, owner, memo) => {
  const res = await authenticatedFetch(`${API_BASE_URL}/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, biz_no, owner, memo })
  });
  const data = await handleResponse(res);
  return data.id;
};

export const updateClient = async (id, name, biz_no, owner, memo) => {
  const res = await authenticatedFetch(`${API_BASE_URL}/clients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, biz_no, owner, memo })
  });
  return handleResponse(res);
};

export const deleteClients = async (ids) => {
  const res = await authenticatedFetch(`${API_BASE_URL}/clients`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  });
  return handleResponse(res);
};

// Items
export const getAllItems = async () => {
  const res = await authenticatedFetch(`${API_BASE_URL}/items`);
  const data = await handleResponse(res);
  return data.map(i => ({
    ...i,
    price: parseFloat(i.price || 0)
  }));
};

export const addItem = async (code, name, spec, price) => {
  const res = await authenticatedFetch(`${API_BASE_URL}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, name, spec, price })
  });
  const data = await handleResponse(res);
  return data.id;
};

export const updateItem = async (id, code, name, spec, price) => {
  const res = await authenticatedFetch(`${API_BASE_URL}/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, name, spec, price })
  });
  return handleResponse(res);
};

// Purchase Orders
export const getAllPurchaseOrders = async () => {
  const res = await authenticatedFetch(`${API_BASE_URL}/purchase-orders`);
  const data = await handleResponse(res);
  return data.map(po => ({
    ...po,
    issue_date: po.issueDate.split('T')[0],
    client_name: po.clientName,
    data: {
      supplier: po.supplier,
      items: po.items.map(it => ({
        ...it,
        completed_qty: it.completedQty || 0
      })),
      footer: po.footer,
      grand_total: po.grandTotal
    }
  }));
};

export const savePurchaseOrder = async (issue_date, client_name, po_data, custom_id = null) => {
  const res = await authenticatedFetch(`${API_BASE_URL}/purchase-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: custom_id,
      issue_date,
      client_name,
      data: po_data
    })
  });
  const data = await handleResponse(res);
  return data.id;
};

export const updatePurchaseOrder = async (id, issue_date, client_name, po_data) => {
  const res = await authenticatedFetch(`${API_BASE_URL}/purchase-orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      issue_date,
      client_name,
      data: po_data
    })
  });
  return handleResponse(res);
};

export const deletePurchaseOrders = async (ids) => {
  const res = await authenticatedFetch(`${API_BASE_URL}/purchase-orders`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  });
  return handleResponse(res);
};

// Fabrics
export const getAllFabrics = async () => {
  const res = await authenticatedFetch(`${API_BASE_URL}/fabrics`);
  return handleResponse(res);
};

export const saveFabric = async (fabricData) => {
  const res = await authenticatedFetch(`${API_BASE_URL}/fabrics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fabricData)
  });
  return handleResponse(res);
};

export const updateFabric = async (id, fabricData) => {
  const res = await authenticatedFetch(`${API_BASE_URL}/fabrics/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fabricData)
  });
  return handleResponse(res);
};

export const deleteFabrics = async (ids) => {
  const res = await authenticatedFetch(`${API_BASE_URL}/fabrics`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  });
  return handleResponse(res);
};
