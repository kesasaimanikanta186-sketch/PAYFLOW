# database.py - SQLite database setup for PayFlow
import sqlite3
import os
import uuid
from werkzeug.security import generate_password_hash

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'payflow.db')


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            mobile TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            upi_id TEXT UNIQUE,
            upi_pin TEXT,
            balance REAL DEFAULT 1000.0,
            role TEXT DEFAULT 'user',
            is_blocked INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            sender TEXT NOT NULL,
            receiver TEXT NOT NULL,
            amount REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            transaction_id TEXT UNIQUE NOT NULL,
            note TEXT,
            date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender) REFERENCES users(id),
            FOREIGN KEY (receiver) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS bank_accounts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            bank_name TEXT NOT NULL,
            account_number TEXT NOT NULL,
            ifsc TEXT NOT NULL,
            is_primary INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    ''')

    # Check if data already exists
    existing = cursor.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    if existing > 0:
        conn.close()
        return

    # -- Seed Data --
    pw = generate_password_hash('password123')
    admin_pw = generate_password_hash('admin123')

    admin_id = str(uuid.uuid4())
    u1 = str(uuid.uuid4())
    u2 = str(uuid.uuid4())
    u3 = str(uuid.uuid4())
    u4 = str(uuid.uuid4())
    u5 = str(uuid.uuid4())

    users_data = [
        (admin_id, 'Admin', 'admin@payflow.com', '9999999999', admin_pw, 'admin@payflow', '1234', 100000.0, 'admin', 0),
        (u1, 'Rahul Sharma', 'rahul@example.com', '9876543210', pw, '9876543210@payflow', '1234', 25000.0, 'user', 0),
        (u2, 'Priya Patel', 'priya@example.com', '9876543211', pw, '9876543211@payflow', '1234', 18000.0, 'user', 0),
        (u3, 'Amit Kumar', 'amit@example.com', '9876543212', pw, '9876543212@payflow', '1234', 32000.0, 'user', 0),
        (u4, 'Sneha Gupta', 'sneha@example.com', '9876543213', pw, '9876543213@payflow', '1234', 9500.0, 'user', 0),
        (u5, 'Vikram Singh', 'vikram@example.com', '9876543214', pw, '9876543214@payflow', '1234', 41000.0, 'user', 0),
    ]
    for u in users_data:
        cursor.execute(
            "INSERT INTO users (id, name, email, mobile, password, upi_id, upi_pin, balance, role, is_blocked) VALUES (?,?,?,?,?,?,?,?,?,?)", u
        )

    # Sample transactions
    txns = [
        (str(uuid.uuid4()), u1, u2, 500.0, 'success', 'TXN' + uuid.uuid4().hex[:8].upper(), 'Lunch money'),
        (str(uuid.uuid4()), u2, u1, 1200.0, 'success', 'TXN' + uuid.uuid4().hex[:8].upper(), 'Rent share'),
        (str(uuid.uuid4()), u1, u3, 300.0, 'success', 'TXN' + uuid.uuid4().hex[:8].upper(), 'Movie tickets'),
        (str(uuid.uuid4()), u3, u4, 2500.0, 'success', 'TXN' + uuid.uuid4().hex[:8].upper(), 'Freelance payment'),
        (str(uuid.uuid4()), u4, u5, 800.0, 'success', 'TXN' + uuid.uuid4().hex[:8].upper(), 'Gift'),
        (str(uuid.uuid4()), u5, u1, 1500.0, 'success', 'TXN' + uuid.uuid4().hex[:8].upper(), 'Book purchase'),
        (str(uuid.uuid4()), u1, u4, 150.0, 'failed', 'TXN' + uuid.uuid4().hex[:8].upper(), 'Snacks'),
        (str(uuid.uuid4()), u2, u3, 3000.0, 'success', 'TXN' + uuid.uuid4().hex[:8].upper(), 'Course fee'),
    ]
    for t in txns:
        cursor.execute(
            "INSERT INTO transactions (id, sender, receiver, amount, status, transaction_id, note) VALUES (?,?,?,?,?,?,?)", t
        )

    # Sample bank accounts
    banks = [
        (str(uuid.uuid4()), u1, 'State Bank of India', '1234567890', 'SBIN0001234', 1),
        (str(uuid.uuid4()), u1, 'HDFC Bank', '9876543210', 'HDFC0005678', 0),
        (str(uuid.uuid4()), u2, 'ICICI Bank', '5678901234', 'ICIC0003456', 1),
        (str(uuid.uuid4()), u3, 'Axis Bank', '3456789012', 'UTIB0002345', 1),
        (str(uuid.uuid4()), u4, 'Punjab National Bank', '7890123456', 'PUNB0006789', 1),
        (str(uuid.uuid4()), u5, 'Bank of Baroda', '2345678901', 'BARB0004567', 1),
    ]
    for b in banks:
        cursor.execute(
            "INSERT INTO bank_accounts (id, user_id, bank_name, account_number, ifsc, is_primary) VALUES (?,?,?,?,?,?)", b
        )

    conn.commit()
    conn.close()
    print("Database initialized with seed data!")


if __name__ == '__main__':
    init_db()
