import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Login specific limiter (stricter)
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login requests per hour
  message: { message: 'Too many login attempts, please try again after an hour' }
});

app.use(limiter);
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Seeding: ensure admin user exists
async function seedAdmin() {
  const newUsername = process.env.ADMIN_ID || 'wert64846';
  const newPassword = process.env.ADMIN_PASSWORD || '!Istar3028!';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Try to find the old admin user first
  const oldAdmin = await prisma.user.findUnique({ where: { username: 'admin' } });
  
  if (oldAdmin) {
    // If old admin exists, update it to the new credentials
    await prisma.user.update({
      where: { username: 'admin' },
      data: {
        username: newUsername,
        password: hashedPassword
      }
    });
    console.log(`Admin user updated: admin -> ${newUsername}`);
  } else {
    // If old admin doesn't exist, ensure the new one exists
    const user = await prisma.user.findUnique({ where: { username: newUsername } });
    if (!user) {
      await prisma.user.create({
        data: {
          username: newUsername,
          password: hashedPassword
        }
      });
      console.log(`Admin user created: ${newUsername}`);
    } else {
      // Ensure the password is correct/updated
      await prisma.user.update({
        where: { username: newUsername },
        data: { password: hashedPassword }
      });
      console.log(`Admin user password updated for: ${newUsername}`);
    }
  }
}
seedAdmin();

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Authentication token required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Authentication
app.post('/api/login', loginLimiter, async (req, res, next) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });
    
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      res.json({ success: true, token, user: { username: user.username } });
    } else {
      res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  } catch (error) {
    next(error);
  }
});

// Protected Routes - Apply middleware to all routes below
app.use(authenticateToken);

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
    next(error);
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
    next(error);
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
    next(error);
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
    next(error);
  }
});

// Clients
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await prisma.client.findMany({ orderBy: { name: 'asc' } });
    res.json(clients);
  } catch (error) {
    next(error);
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
    next(error);
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
    next(error);
  }
});

// Items
app.get('/api/items', async (req, res) => {
  try {
    const items = await prisma.itemMaster.findMany({ orderBy: { code: 'asc' } });
    res.json(items);
  } catch (error) {
    next(error);
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
    next(error);
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
    next(error);
  }
});


// Purchase Orders
app.get('/api/purchase-orders', async (req, res) => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      include: { items: true },
      orderBy: { issueDate: 'desc' }
    });
    
    const parsedPOs = pos.map(po => ({
      ...po,
      supplier: JSON.parse(po.supplier || '{}'),
      footer: JSON.parse(po.footer || '{}')
    }));
    
    res.json(parsedPOs);
  } catch (error) {
    next(error);
  }
});

app.post('/api/purchase-orders', async (req, res) => {
  const { id, issue_date, client_name, data } = req.body;
  try {
    const po = await prisma.purchaseOrder.create({
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
            completedQty: parseFloat(item.completed_qty || 0),
            price: parseFloat(item.price || 0),
            supply: parseFloat(item.supply || 0),
            tax: parseFloat(item.tax || 0),
            note: item.note
          }))
        }
      },
      include: { items: true }
    });
    res.json(po);
  } catch (error) {
    next(error);
  }
});

app.put('/api/purchase-orders/:id', async (req, res) => {
  const { id } = req.params;
  const { issue_date, client_name, data } = req.body;
  try {
    await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
    
    const po = await prisma.purchaseOrder.update({
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
            completedQty: parseFloat(item.completed_qty || 0),
            price: parseFloat(item.price || 0),
            supply: parseFloat(item.supply || 0),
            tax: parseFloat(item.tax || 0),
            note: item.note
          }))
        }
      },
      include: { items: true }
    });
    res.json(po);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/purchase-orders', async (req, res) => {
  const { ids } = req.body;
  try {
    await prisma.purchaseOrder.deleteMany({
      where: { id: { in: ids } }
    });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Fabrics
app.get('/api/fabrics', async (req, res) => {
  try {
    const fabrics = await prisma.fabric.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    res.json(fabrics);
  } catch (error) {
    next(error);
  }
});

app.post('/api/fabrics', async (req, res) => {
  const { code, name, supplier, color, unit, stock, memo } = req.body;
  try {
    const fabric = await prisma.fabric.create({
      data: { code, name, supplier, color, unit, stock: parseFloat(stock || 0), memo }
    });
    res.json(fabric);
  } catch (error) {
    next(error);
  }
});

app.put('/api/fabrics/:id', async (req, res) => {
  const { id } = req.params;
  const { code, name, supplier, color, unit, stock, memo } = req.body;
  try {
    const fabric = await prisma.fabric.update({
      where: { id: parseInt(id) },
      data: { code, name, supplier, color, unit, stock: parseFloat(stock || 0), memo }
    });
    res.json(fabric);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/fabrics', async (req, res) => {
  const { ids } = req.body;
  try {
    await prisma.fabric.deleteMany({
      where: { id: { in: ids.map(id => parseInt(id)) } }
    });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server' });
});

// Handle SPA routing - send index.html for any unknown requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
