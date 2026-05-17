# bills.py - Bill payment routes for PayFlow
import uuid
from flask import Blueprint, request, jsonify, g
from auth import login_required
from database import get_db

bills_bp = Blueprint('bills', __name__)

# Available bill categories and providers
BILL_PROVIDERS = {
    'mobile': ['Jio', 'Airtel', 'Vi', 'BSNL'],
    'electricity': ['State Electricity Board', 'Tata Power', 'Adani Electricity', 'BESCOM'],
    'water': ['Municipal Water Supply', 'Delhi Jal Board', 'BWSSB'],
    'internet': ['Airtel Broadband', 'Jio Fiber', 'ACT Fibernet', 'BSNL Broadband'],
    'dth': ['Tata Play', 'Airtel Digital TV', 'Dish TV', 'Sun Direct'],
    'credit_card': ['HDFC Credit Card', 'SBI Credit Card', 'ICICI Credit Card', 'Axis Credit Card'],
}


@bills_bp.route('/providers', methods=['GET'])
@login_required
def get_providers():
    """Get all bill categories and providers"""
    return jsonify({'providers': BILL_PROVIDERS})


@bills_bp.route('/pay', methods=['POST'])
@login_required
def pay_bill():
    """Pay a bill"""
    data = request.get_json()

    required = ['bill_type', 'provider', 'amount', 'account_number', 'upi_pin']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    amount = float(data['amount'])
    if amount <= 0:
        return jsonify({'error': 'Valid amount is required'}), 400

    conn = get_db()

    # Verify UPI PIN
    user = conn.execute(
        "SELECT upi_pin FROM users WHERE id = ?", (g.user['id'],)
    ).fetchone()
    if user['upi_pin'] != data['upi_pin']:
        conn.close()
        return jsonify({'error': 'Incorrect UPI PIN'}), 401

    # Check wallet balance
    wallet = conn.execute(
        "SELECT balance FROM wallet WHERE user_id = ?", (g.user['id'],)
    ).fetchone()
    if not wallet or wallet['balance'] < amount:
        conn.close()
        return jsonify({'error': 'Insufficient wallet balance'}), 400

    # Deduct from wallet
    conn.execute(
        "UPDATE wallet SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
        (amount, g.user['id'])
    )

    # Create bill payment record
    bill_id = str(uuid.uuid4())
    conn.execute(
        """INSERT INTO bill_payments (id, user_id, bill_type, provider, amount, account_number, status)
           VALUES (?,?,?,?,?,?,?)""",
        (bill_id, g.user['id'], data['bill_type'], data['provider'],
         amount, data['account_number'], 'success')
    )

    # Wallet history
    conn.execute(
        "INSERT INTO wallet_history (id, user_id, amount, type, description) VALUES (?,?,?,?,?)",
        (str(uuid.uuid4()), g.user['id'], -amount, 'debit',
         f'Bill: {data["provider"]} ({data["bill_type"]})')
    )

    # Notification
    conn.execute(
        "INSERT INTO notifications (id, user_id, title, message, type) VALUES (?,?,?,?,?)",
        (str(uuid.uuid4()), g.user['id'], 'Bill Payment Successful',
         f'₹{amount:.2f} paid for {data["provider"]} ({data["bill_type"]})', 'success')
    )

    # Reward for bill payment (1% cashback, max ₹25)
    cashback = min(amount * 0.01, 25)
    points = int(amount / 20)
    if points > 0:
        conn.execute(
            "INSERT INTO rewards (id, user_id, points, cashback_amount, description) VALUES (?,?,?,?,?)",
            (str(uuid.uuid4()), g.user['id'], points, cashback,
             f'Bill payment reward - {data["provider"]}')
        )
        conn.execute(
            "UPDATE wallet SET balance = balance + ? WHERE user_id = ?",
            (cashback, g.user['id'])
        )

    conn.commit()

    updated_wallet = conn.execute(
        "SELECT balance FROM wallet WHERE user_id = ?", (g.user['id'],)
    ).fetchone()
    conn.close()

    return jsonify({
        'message': f'Bill payment of ₹{amount:.2f} successful',
        'bill': {
            'id': bill_id, 'bill_type': data['bill_type'],
            'provider': data['provider'], 'amount': amount, 'status': 'success'
        },
        'wallet_balance': updated_wallet['balance']
    })


@bills_bp.route('', methods=['GET'])
@login_required
def get_bill_history():
    """Get bill payment history"""
    conn = get_db()
    bills = conn.execute(
        "SELECT * FROM bill_payments WHERE user_id = ? ORDER BY created_at DESC",
        (g.user['id'],)
    ).fetchall()
    conn.close()
    return jsonify({'bills': [dict(b) for b in bills]})
