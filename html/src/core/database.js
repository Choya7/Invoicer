const API_BASE_URL = `http://${window.location.hostname}:5000/api`;

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Server Error');
  }
  return response.json();
};

// Invoices
export const getAllInvoices = async () => {
  const res = await fetch(`${API_BASE_URL}/invoices`);
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
  const res = await fetch(`${API_BASE_URL}/invoices`, {
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
  const res = await fetch(`${API_BASE_URL}/invoices/${id}`, {
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
  const res = await fetch(`${API_BASE_URL}/invoices`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  });
  return handleResponse(res);
};

// Clients
export const getAllClients = async () => {
  const res = await fetch(`${API_BASE_URL}/clients`);
  const data = await handleResponse(res);
  return data.map(c => ({
    ...c,
    biz_no: c.bizNo || ''
  }));
};

export const addClient = async (name, biz_no, owner, memo) => {
  const res = await fetch(`${API_BASE_URL}/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, biz_no, owner, memo })
  });
  const data = await handleResponse(res);
  return data.id;
};

export const updateClient = async (id, name, biz_no, owner, memo) => {
  const res = await fetch(`${API_BASE_URL}/clients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, biz_no, owner, memo })
  });
  return handleResponse(res);
};

// Items
export const getAllItems = async () => {
  const res = await fetch(`${API_BASE_URL}/items`);
  const data = await handleResponse(res);
  return data.map(i => ({
    ...i,
    price: parseFloat(i.price || 0)
  }));
};

export const addItem = async (code, name, spec, price) => {
  const res = await fetch(`${API_BASE_URL}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, name, spec, price })
  });
  const data = await handleResponse(res);
  return data.id;
};

export const updateItem = async (id, code, name, spec, price) => {
  const res = await fetch(`${API_BASE_URL}/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, name, spec, price })
  });
  return handleResponse(res);
};
