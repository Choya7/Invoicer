import sqlite3
import json
import secrets
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'invoicer.db')

def init_db():
    if not os.path.exists(os.path.dirname(DB_PATH)):
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            issue_date TEXT,
            client_name TEXT,
            data TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            biz_no TEXT,
            owner TEXT,
            memo TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT,
            name TEXT,
            spec TEXT,
            price INTEGER
        )
    ''')
    conn.commit()
    conn.close()

def save_invoice(issue_date, client_name, invoice_data):
    init_db()
    # Generate a 256-bit unique hex string (32 bytes = 64 hex chars = 256 bits)
    unique_id = secrets.token_hex(32)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO invoices (id, issue_date, client_name, data)
        VALUES (?, ?, ?, ?)
    ''', (unique_id, issue_date, client_name, json.dumps(invoice_data, ensure_ascii=False)))
    conn.commit()
    conn.close()
    return unique_id

def get_all_invoices():
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, issue_date, client_name, data FROM invoices ORDER BY issue_date DESC")
    rows = cursor.fetchall()
    conn.close()
    
    invoices = []
    for row in rows:
        invoices.append({
            "id": row[0],
            "issue_date": row[1],
            "client_name": row[2],
            "data": json.loads(row[3])
        })
    return invoices

def get_all_clients():
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, biz_no, owner, memo FROM clients ORDER BY name ASC")
    rows = cursor.fetchall()
    conn.close()
    
    clients = []
    for row in rows:
        clients.append({
            "id": row[0],
            "name": row[1],
            "biz_no": row[2],
            "owner": row[3],
            "memo": row[4]
        })
    return clients

def add_client(name, biz_no, owner, memo):
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO clients (name, biz_no, owner, memo) VALUES (?, ?, ?, ?)", 
                   (name, biz_no, owner, memo))
    conn.commit()
    conn.close()

def update_client(client_id, name, biz_no, owner, memo):
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE clients SET name=?, biz_no=?, owner=?, memo=? WHERE id=?", 
                   (name, biz_no, owner, memo, client_id))
    conn.commit()
    conn.close()

def get_all_items():
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, code, name, spec, price FROM items ORDER BY code ASC")
    rows = cursor.fetchall()
    conn.close()
    
    items = []
    for row in rows:
        items.append({
            "id": row[0],
            "code": row[1],
            "name": row[2],
            "spec": row[3],
            "price": row[4]
        })
    return items

def add_item(code, name, spec, price):
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO items (code, name, spec, price) VALUES (?, ?, ?, ?)", 
                   (code, name, spec, price))
    conn.commit()
    conn.close()

def update_item(item_id, code, name, spec, price):
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE items SET code=?, name=?, spec=?, price=? WHERE id=?", 
                   (code, name, spec, price, item_id))
    conn.commit()
    conn.close()
