# wallet.py - Wallet management routes for PayFlow
import uuid
from flask import Blueprint, request, jsonify, g
from auth import login_required
from database import get_db

wallet_bp = Blueprint('wallet', __name__)


@wallet_bp.route('', methods=['GET'])
@login_required
def get_wallet():
    """Get wallet balance"""
    conn = get_db()
    wallet = conn.execute(
        "SELECT * FROM wallet WHERE user_id = ?", (g.user['id'],)
    ).fetchone()

    if not wallet:
        # Create wallet if it doesn't exist
        wallet_id = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO wallet (id, user_id, balance) VALUES (?,?,?)",
            (wallet_id, g.user['id'], 0)
        )
        conn.commit()
        wallet = conn.execute(
            "SELECT * FROM wallet WHERE user_id = ?", (g.user['id'],)
        ).fetchone()

    conn.close()
    return jsonify({'wallet': dict(wallet)})


@wallet_bp.route('/add', methods=['POST'])
@login_required
def add_money():
    """Add money to wallet (simulated bank transfer)"""
    data = request.get_json()

    if not data.get('amount') or float(data['amount']) <= 0:
        return jsonify({'error': 'Valid amount is required'}), 400

    amount = float(data['amount'])
    if amount > 100000:
        return jsonify({'error': 'Maximum add limit is ₹1,00,000'}), 400

    conn = get_db()

    conn.execute(
        "UPDATE wallet SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
        (amount, g.user['id'])
    )

    conn.execute(
        "INSERT INTO wallet_history (id, user_id, amount, type, description) VALUES (?,?,?,?,?)",
        (str(uuid.uuid4()), g.user['id'], amount, 'credit',
         f'Added from {data.get("bank_name", "Bank Account")}')
    )

    conn.execute(
        "INSERT INTO notifications (id, user_id, title, message, type) VALUES (?,?,?,?,?)",
        (str(uuid.uuid4()), g.user['id'], 'Money Added',
         f'₹{amount:.2f} added to your PayFlow wallet', 'success')
    )

    conn.commit()

    wallet = conn.execute(
        "SELECT balance FROM wallet WHERE user_id = ?", (g.user['id'],)
    ).fetchone()
    conn.close()

    return jsonify({
        'message': f'₹{amount:.2f} added to wallet',
        'new_balance': wallet['balance']
    })


@wallet_bp.route('/transfer', methods=['POST'])
@login_required
def transfer_to_bank():
    """Transfer money from wallet to bank"""
    data = request.get_json()

    if not data.get('amount') or float(data['amount']) <= 0:
        return jsonify({'error': 'Valid amount is required'}), 400
    if not data.get('upi_pin'):
        return jsonify({'error': 'UPI PIN is required'}), 400

    amount = float(data['amount'])

    conn = get_db()

    # Verify PIN
    user = conn.execute(
        "SELECT upi_pin FROM users WHERE id = ?", (g.user['id'],)
    ).fetchone()
    if user['upi_pin'] != data['upi_pin']:
        conn.close()
        return jsonify({'error': 'Incorrect UPI PIN'}), 401

    # Check balance
    wallet = conn.execute(
        "SELECT balance FROM wallet WHERE user_id = ?", (g.user['id'],)
    ).fetchone()
    if not wallet or wallet['balance'] < amount:
        conn.close()
        return jsonify({'error': 'Insufficient wallet balance'}), 400

    conn.execute(
        "UPDATE wallet SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
        (amount, g.user['id'])
    )

    conn.execute(
        "INSERT INTO wallet_history (id, user_id, amount, type, description) VALUES (?,?,?,?,?)",
        (str(uuid.uuid4()), g.user['id'], -amount, 'debit',
         f'Transferred to {data.get("bank_name", "Bank Account")}')
    )

    conn.execute(
        "INSERT INTO notifications (id, user_id, title, message, type) VALUES (?,?,?,?,?)",
        (str(uuid.uuid4()), g.user['id'], 'Transfer Successful',
         f'₹{amount:.2f} transferred to your bank account', 'success')
    )

    conn.commit()

    updated = conn.execute(
        "SELECT balance FROM wallet WHERE user_id = ?", (g.user['id'],)
    ).fetchone()
    conn.close()

    return jsonify({
        'message': f'₹{amount:.2f} transferred to bank',
        'new_balance': updated['balance']
    })


@wallet_bp.route('/history', methods=['GET'])
@login_required
def wallet_history():
    """Get wallet transaction history"""
    conn = get_db()
    history = conn.execute(
        "SELECT * FROM wallet_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
        (g.user['id'],)
    ).fetchall()
    conn.close()

    return jsonify({'history': [dict(h) for h in history]})
