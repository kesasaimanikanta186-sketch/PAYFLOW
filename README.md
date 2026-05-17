# PayFlow - Full UPI Payment Simulation App

A complete full-stack UPI payment simulation built with **React** (Vite) and **Python Flask**. Every transaction flows through the backend, updates the database, and reflects in real-time — no mock data, no frontend-only logic.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Routing | React Router DOM v6 |
| HTTP Client | Axios |
| Charts | Recharts |
| Icons | React Icons (Ionicons) |
| Backend | Python Flask |
| Database | SQLite |
| Email | EmailJS (REST API) |

---

## Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.9+

### One-Command Setup

```bash
python start.py
```

This installs all dependencies and starts both servers automatically.

### Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
python app.py
```
Backend runs at: `http://localhost:5000`

**Frontend:**
```bash
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **User** | rahul@example.com | password123 |
| **User** | priya@example.com | password123 |
| **User** | amit@example.com | password123 |
| **Admin** | admin@payflow.com | admin123 |

**Default UPI PIN:** `1234` (all demo users)

---

## Database Schema (SQLite)

```sql
users:       id, name, email, mobile, password, upi_id, upi_pin, balance, role, is_blocked, created_at
sessions:    token, user_id, created_at
transactions: id, sender, receiver, amount, status (pending/success/failed), transaction_id, note, date_time
bank_accounts: id, user_id, bank_name, account_number, ifsc, is_primary, created_at
```

---

## Transaction Flow (Core Architecture)

```
React UI → Flask API → SQLite Database → Process Logic → Update DB → Response → UI Update → EmailJS
```

**Step-by-step:**
1. User submits payment → Frontend sends POST to `/api/transactions/send`
2. Backend inserts transaction with `status = 'pending'`
3. Backend validates UPI PIN
4. Backend checks sender balance
5. **IF SUCCESS**: Deduct sender, add receiver, update status to `'success'`
6. **IF FAILURE**: No balance change, update status to `'failed'`
7. Return JSON response with status + transaction_id
8. Frontend refreshes data from API
9. EmailJS sends email ONLY after final backend response

---

## Features

### User Features
- **Authentication** - Register, login, auto UPI ID generation
- **Dashboard** - Balance display, quick actions, recent transactions
- **Send Money** - Multi-step flow with UPI PIN verification, processing animation
- **Transaction History** - Search, filter by status (success/pending/failed)
- **Bank Accounts** - Add/remove accounts, set primary
- **Profile** - Edit name/email, change password, change UPI PIN
- **Dark/Light Theme** - Toggle with localStorage persistence

### Admin Panel (`/admin`)
- View all users with balances
- Block/unblock users
- View all transactions (with pending/success/failed status)
- Analytics dashboard with charts (Bar, Pie, Line)
- Real-time stats from database

---

## API Endpoints

### Auth (`/api/auth`)
- `POST /register` - Register user (gets ₹1000 welcome balance)
- `POST /login` - Login
- `GET /profile` - Get profile (includes balance)
- `PUT /profile` - Update name/email
- `PUT /change-password` - Change password
- `PUT /change-pin` - Change UPI PIN
- `POST /logout` - Logout
- `GET /users/search?q=` - Search users
- `GET /users/recent` - Recent contacts

### Transactions (`/api/transactions`)
- `POST /send` - Send money (pending → success/failed)
- `GET /` - Transaction history (paginated, filterable)
- `GET /:id` - Transaction detail
- `GET /stats` - User's transaction stats

### Bank Accounts (`/api/bank-accounts`)
- `GET /` - List accounts
- `POST /` - Add account
- `PUT /:id/primary` - Set primary
- `DELETE /:id` - Remove account

### Admin (`/api/admin`) - requires admin role
- `GET /users` - All users
- `PUT /users/:id/block` - Block user
- `PUT /users/:id/unblock` - Unblock user
- `GET /transactions` - All transactions
- `GET /stats` - Dashboard statistics

---

## Project Structure

```
PayFlow/
├── backend/
│   ├── app.py              # Flask main app (4 blueprints)
│   ├── database.py         # SQLite schema + seed data
│   ├── auth.py             # Auth routes + middleware
│   ├── transactions.py     # Send money (pending flow)
│   ├── bank_accounts.py    # Bank CRUD
│   ├── admin.py            # Admin APIs (role-protected)
│   └── requirements.txt
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/              # Route pages
│   ├── context/            # Auth, Theme, Toast contexts
│   ├── services/           # API client + EmailJS
│   ├── App.jsx             # Router
│   ├── main.jsx            # Entry point
│   └── index.css           # Tailwind + custom styles
├── start.py                # One-file setup & launcher
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## Critical Rules Followed

1. NO mock data — all data from SQLite
2. NO frontend-only balance updates — always from backend
3. ALL transactions stored in database with status tracking
4. Admin reads ONLY from backend APIs
5. Transaction status always updates in database first
6. EmailJS triggers ONLY after final backend response
7. Backend is the single source of truth

---

## React Concepts Used

- useState, useEffect
- Props, conditional rendering
- React Router DOM (SPA routing)
- Context API (Auth, Theme, Toast)
- Axios API calls with interceptors
- Controlled forms
- Protected routes

---

## EmailJS Setup (Optional)

1. Sign up at [emailjs.com](https://www.emailjs.com/)
2. Create a service and template
3. Update credentials in `src/services/emailService.js`

---

## License

MIT - Built for educational purposes.
