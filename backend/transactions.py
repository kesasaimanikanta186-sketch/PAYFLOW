# transactions.py - Transaction routes for PayFlow
import uuid
from flask import Blueprint, request, jsonify, g
from auth import login_required
from database import get_db

transactions_bp = Blueprint('transactions', __name__)


@transactions_bp.route('/send', methods=['POST'])
@login_required
def send_money():
    data = request.get_json()

    if not data.get('receiver_upi'):
        return jsonify({'error': 'Receiver UPI ID is required'}), 400
    if not data.get('amount') or float(data['amount']) <= 0:
        return jsonify({'error': 'Valid amount is required'}), 400
    if not data.get('upi_pin'):
        return jsonify({'error': 'UPI PIN is required'}), 400

    amount = float(data['amount'])
    if amount > 100000:
        return jsonify({'error': 'Maximum transaction limit is 1,00,000'}), 400

    db = get_db()
    txn_id = str(uuid.uuid4())
    transaction_id = 'TXN' + uuid.uuid4().hex[:8].upper()

    # Find receiver by UPI ID
    receiver = db.execute("SELECT id, name, upi_id FROM users WHERE upi_id = ?", (data['receiver_upi'],)).fetchone()
    if not receiver:
        db.close()
        return jsonify({'error': 'Receiver UPI ID not found'}), 404

    if receiver['id'] == g.user['id']:
        db.close()
        return jsonify({'error': 'Cannot send money to yourself'}), 400

    # STEP 1: Insert transaction as PENDING
    db.execute(
        "INSERT INTO transactions (id, sender, receiver, amount, status, transaction_id, note) VALUES (?,?,?,?,?,?,?)",
        (txn_id, g.user['id'], receiver['id'], amount, 'pending', transaction_id, data.get('note', ''))
    )
    db.commit()

    # STEP 2: Verify UPI PIN
    sender = db.execute("SELECT upi_pin, balance FROM users WHERE id = ?", (g.user['id'],)).fetchone()
    if sender['upi_pin'] != data['upi_pin']:
        db.execute("UPDATE transactions SET status = 'failed' WHERE id = ?", (txn_id,))
        db.commit()
        db.close()
        return jsonify({'error': 'Incorrect UPI PIN', 'status': 'failed', 'transaction_id': transaction_id}), 401

    # STEP 3: Check balance
    if sender['balance'] < amount:
        db.execute("UPDATE transactions SET status = 'failed' WHERE id = ?", (txn_id,))
        db.commit()
        db.close()
        return jsonify({'error': 'Insufficient balance', 'status': 'failed', 'transaction_id': transaction_id}), 400

    # STEP 4: Process - deduct sender, add receiver (with race condition guard)
    result = db.execute(
        "UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?",
        (amount, g.user['id'], amount)
    )
    if result.rowcount == 0:
        db.execute("UPDATE transactions SET status = 'failed' WHERE id = ?", (txn_id,))
        db.commit()
        db.close()
        return jsonify({'error': 'Insufficient balance', 'status': 'failed', 'transaction_id': transaction_id}), 400

    db.execute("UPDATE users SET balance = balance + ? WHERE id = ?", (amount, receiver['id']))

    # STEP 5: Update transaction status to SUCCESS
    db.execute("UPDATE transactions SET status = 'success' WHERE id = ?", (txn_id,))
    db.commit()

    # Get updated balance
    new_balance = db.execute("SELECT balance FROM users WHERE id = ?", (g.user['id'],)).fetchone()['balance']
    db.close()

    return jsonify({
        'message': 'Payment successful',
        'status': 'success',
        'transaction_id': transaction_id,
        'transaction': {
            'id': txn_id,
            'transaction_id': transaction_id,
            'amount': amount,
            'receiver_name': receiver['name'],
            'receiver_upi': receiver['upi_id'],
            'status': 'success',
            'note': data.get('note', '')
        },
        'new_balance': new_balance
    })


@transactions_bp.route('', methods=['GET'])
@login_required
def get_transactions():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    search = request.args.get('search', '').strip()
    status_filter = request.args.get('status', '')
    offset = (page - 1) * per_page

    db = get_db()

    query = """
        SELECT t.id, t.sender, t.receiver, t.amount, t.status, t.transaction_id, t.note, t.date_time,
               s.name as sender_name, s.upi_id as sender_upi,
               r.name as receiver_name, r.upi_id as receiver_upi
        FROM transactions t
        LEFT JOIN users s ON t.sender = s.id
        LEFT JOIN users r ON t.receiver = r.id
        WHERE (t.sender = ? OR t.receiver = ?)
    """
    params = [g.user['id'], g.user['id']]

    if search:
        query += " AND (s.name LIKE ? OR r.name LIKE ? OR t.note LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s])

    if status_filter:
        query += " AND t.status = ?"
        params.append(status_filter)

    count_query = "SELECT COUNT(*) FROM transactions t LEFT JOIN users s ON t.sender = s.id LEFT JOIN users r ON t.receiver = r.id WHERE (t.sender = ? OR t.receiver = ?)"
    count_params = [g.user['id'], g.user['id']]
    if search:
        count_query += " AND (s.name LIKE ? OR r.name LIKE ? OR t.note LIKE ?)"
        count_params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
    if status_filter:
        count_query += " AND t.status = ?"
        count_params.append(status_filter)

    total = db.execute(count_query, count_params).fetchone()[0]

    query += " ORDER BY t.date_time DESC LIMIT ? OFFSET ?"
    params.extend([per_page, offset])

    rows = db.execute(query, params).fetchall()
    db.close()

    transactions = []
    for row in rows:
        txn = dict(row)
        txn['direction'] = 'sent' if txn['sender'] == g.user['id'] else 'received'
        transactions.append(txn)

    return jsonify({
        'transactions': transactions,
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': (total + per_page - 1) // per_page
    })


@transactions_bp.route('/<txn_id>', methods=['GET'])
@login_required
def get_transaction_detail(txn_id):
    db = get_db()
    txn = db.execute('''
        SELECT t.*, s.name as sender_name, s.upi_id as sender_upi,
               r.name as receiver_name, r.upi_id as receiver_upi
        FROM transactions t
        LEFT JOIN users s ON t.sender = s.id
        LEFT JOIN users r ON t.receiver = r.id
        WHERE t.id = ? AND (t.sender = ? OR t.receiver = ?)
    ''', (txn_id, g.user['id'], g.user['id'])).fetchone()
    db.close()

    if not txn:
        return jsonify({'error': 'Transaction not found'}), 404

    result = dict(txn)
    result['direction'] = 'sent' if result['sender'] == g.user['id'] else 'received'
    return jsonify({'transaction': result})


@transactions_bp.route('/stats', methods=['GET'])
@login_required
def get_stats():
    db = get_db()

    total_sent = db.execute(
        "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE sender = ? AND status = 'success'",
        (g.user['id'],)
    ).fetchone()['total']

    total_received = db.execute(
        "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE receiver = ? AND status = 'success'",
        (g.user['id'],)
    ).fetchone()['total']

    txn_count = db.execute(
        "SELECT COUNT(*) as count FROM transactions WHERE sender = ? OR receiver = ?",
        (g.user['id'], g.user['id'])
    ).fetchone()['count']

    monthly = db.execute('''
        SELECT strftime('%Y-%m', date_time) as month,
               SUM(CASE WHEN sender = ? THEN amount ELSE 0 END) as sent,
               SUM(CASE WHEN receiver = ? THEN amount ELSE 0 END) as received
        FROM transactions WHERE status = 'success'
        AND (sender = ? OR receiver = ?)
        GROUP BY month ORDER BY month DESC LIMIT 6
    ''', (g.user['id'], g.user['id'], g.user['id'], g.user['id'])).fetchall()

    db.close()

    return jsonify({
        'total_sent': total_sent,
        'total_received': total_received,
        'transaction_count': txn_count,
        'monthly_data': [dict(m) for m in monthly]
    })
