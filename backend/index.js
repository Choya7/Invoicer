import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Invoices
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { items: true },
      orderBy: { issueDate: 'desc' }
    });
    
    // Parse JSON strings back to objects for SQLite
    const parsedInvoices = invoices.map(inv => ({
      ...inv,
      supplier: JSON.parse(inv.supplier || '{}'),
      footer: JSON.parse(inv.footer || '{}')
    }));
    
    res.json(parsedInvoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  const { id, issue_date, client_name, data } = req.body;
  try {
    const invoice = await prisma.invoice.create({
      data: {
        id,
        issueDate: new Date(issue_date),
        clientName: client_name,
        supplier: JSON.stringify(data.supplier || {}),
        footer: JSON.stringify(data.footer || {}),
        grandTotal: data.grand_total,
        items: {
          create: data.items.map(item => ({
            date: item.date,
            code: item.code,
            name: item.name,
            spec: item.spec,
            qty: parseFloat(item.qty || 0),
            price: parseFloat(item.price || 0),
            supply: parseFloat(item.supply || 0),
            tax: parseFloat(item.tax || 0),
            note: item.note
          }))
        }
      },
      include: { items: true }
    });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/invoices/:id', async (req, res) => {
  const { id } = req.params;
  const { issue_date, client_name, data } = req.body;
  try {
    // Delete existing items first for a clean update
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
    
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        issueDate: new Date(issue_date),
        clientName: client_name,
        supplier: JSON.stringify(data.supplier || {}),
        footer: JSON.stringify(data.footer || {}),
        grandTotal: data.grand_total,
        items: {
          create: data.items.map(item => ({
            date: item.date,
            code: item.code,
            name: item.name,
            spec: item.spec,
            qty: parseFloat(item.qty || 0),
            price: parseFloat(item.price || 0),
            supply: parseFloat(item.supply || 0),
            tax: parseFloat(item.tax || 0),
            note: item.note
          }))
        }
      },
      include: { items: true }
    });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/invoices', async (req, res) => {
  const { ids } = req.body;
  try {
    await prisma.invoice.deleteMany({
      where: { id: { in: ids } }
    });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clients
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await prisma.client.findMany({ orderBy: { name: 'asc' } });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clients', async (req, res) => {
  const { name, biz_no, owner, memo } = req.body;
  try {
    const client = await prisma.client.create({
      data: { name, bizNo: biz_no, owner, memo }
    });
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  const { id } = req.params;
  const { name, biz_no, owner, memo } = req.body;
  try {
    const client = await prisma.client.update({
      where: { id: parseInt(id) },
      data: { name, bizNo: biz_no, owner, memo }
    });
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Items
app.get('/api/items', async (req, res) => {
  try {
    const items = await prisma.itemMaster.findMany({ orderBy: { code: 'asc' } });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/items', async (req, res) => {
  const { code, name, spec, price } = req.body;
  try {
    const item = await prisma.itemMaster.create({
      data: { code, name, spec, price: parseFloat(price || 0) }
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  const { code, name, spec, price } = req.body;
  try {
    const item = await prisma.itemMaster.update({
      where: { id: parseInt(id) },
      data: { code, name, spec, price: parseFloat(price || 0) }
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
