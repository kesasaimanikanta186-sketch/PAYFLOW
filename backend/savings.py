# savings.py - Savings goals management for PayFlow
import uuid
from flask import Blueprint, request, jsonify, g
from auth import login_required
from database import get_db

savings_bp = Blueprint('savings', __name__)


@savings_bp.route('', methods=['GET'])
@login_required
def get_savings():
    """Get all savings goals"""
    conn = get_db()
    goals = conn.execute(
        "SELECT * FROM savings WHERE user_id = ? ORDER BY created_at DESC",
        (g.user['id'],)
    ).fetchall()
    conn.close()
    return jsonify({'savings': [dict(s) for s in goals]})


@savings_bp.route('', methods=['POST'])
@login_required
def create_goal():
    """Create a new savings goal"""
    data = request.get_json()

    if not data.get('goal_name'):
        return jsonify({'error': 'Goal name is required'}), 400
    if not data.get('target_amount') or float(data['target_amount']) <= 0:
        return jsonify({'error': 'Valid target amount is required'}), 400

    goal_id = str(uuid.uuid4())
    conn = get_db()
    conn.execute(
        "INSERT INTO savings (id, user_id, goal_name, target_amount, current_amount) VALUES (?,?,?,?,?)",
        (goal_id, g.user['id'], data['goal_name'], float(data['target_amount']), 0)
    )
    conn.commit()
    conn.close()

    return jsonify({
        'message': 'Savings goal created',
        'goal': {
            'id': goal_id, 'goal_name': data['goal_name'],
            'target_amount': float(data['target_amount']), 'current_amount': 0
        }
    }), 201


@savings_bp.route('/<goal_id>/deposit', methods=['POST'])
@login_required
def deposit(goal_id):
    """Add money to a savings goal from wallet"""
    data = request.get_json()

    if not data.get('amount') or float(data['amount']) <= 0:
        return jsonify({'error': 'Valid amount is required'}), 400

    amount = float(data['amount'])
    conn = get_db()

    # Check goal exists and belongs to user
    goal = conn.execute(
        "SELECT * FROM savings WHERE id = ? AND user_id = ?", (goal_id, g.user['id'])
    ).fetchone()
    if not goal:
        conn.close()
        return jsonify({'error': 'Savings goal not found'}), 404

    # Check wallet balance
    wallet = conn.execute(
        "SELECT balance FROM wallet WHERE user_id = ?", (g.user['id'],)
    ).fetchone()
    if not wallet or wallet['balance'] < amount:
        conn.close()
        return jsonify({'error': 'Insufficient wallet balance'}), 400

    # Deduct from wallet, add to savings
    conn.execute(
        "UPDATE wallet SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
        (amount, g.user['id'])
    )
    conn.execute(
        "UPDATE savings SET current_amount = current_amount + ? WHERE id = ?",
        (amount, goal_id)
    )
    conn.execute(
        "INSERT INTO wallet_history (id, user_id, amount, type, description) VALUES (?,?,?,?,?)",
        (str(uuid.uuid4()), g.user['id'], -amount, 'debit', f'Savings: {goal["goal_name"]}')
    )

    conn.commit()

    updated_goal = conn.execute("SELECT * FROM savings WHERE id = ?", (goal_id,)).fetchone()
    updated_wallet = conn.execute("SELECT balance FROM wallet WHERE user_id = ?", (g.user['id'],)).fetchone()
    conn.close()

    return jsonify({
        'message': f'₹{amount:.2f} added to {goal["goal_name"]}',
        'goal': dict(updated_goal),
        'wallet_balance': updated_wallet['balance']
    })


@savings_bp.route('/<goal_id>/withdraw', methods=['POST'])
@login_required
def withdraw(goal_id):
    """Withdraw from savings goal back to wallet"""
    data = request.get_json()

    if not data.get('amount') or float(data['amount']) <= 0:
        return jsonify({'error': 'Valid amount is required'}), 400

    amount = float(data['amount'])
    conn = get_db()

    goal = conn.execute(
        "SELECT * FROM savings WHERE id = ? AND user_id = ?", (goal_id, g.user['id'])
    ).fetchone()
    if not goal:
        conn.close()
        return jsonify({'error': 'Savings goal not found'}), 404

    if goal['current_amount'] < amount:
        conn.close()
        return jsonify({'error': 'Insufficient savings balance'}), 400

    conn.execute(
        "UPDATE savings SET current_amount = current_amount - ? WHERE id = ?",
        (amount, goal_id)
    )
    conn.execute(
        "UPDATE wallet SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
        (amount, g.user['id'])
    )
    conn.execute(
        "INSERT INTO wallet_history (id, user_id, amount, type, description) VALUES (?,?,?,?,?)",
        (str(uuid.uuid4()), g.user['id'], amount, 'credit', f'Withdraw from: {goal["goal_name"]}')
    )

    conn.commit()

    updated_goal = conn.execute("SELECT * FROM savings WHERE id = ?", (goal_id,)).fetchone()
    updated_wallet = conn.execute("SELECT balance FROM wallet WHERE user_id = ?", (g.user['id'],)).fetchone()
    conn.close()

    return jsonify({
        'message': f'₹{amount:.2f} withdrawn from {goal["goal_name"]}',
        'goal': dict(updated_goal),
        'wallet_balance': updated_wallet['balance']
    })


@savings_bp.route('/<goal_id>', methods=['DELETE'])
@login_required
def delete_goal(goal_id):
    """Delete a savings goal and return money to wallet"""
    conn = get_db()

    goal = conn.execute(
        "SELECT * FROM savings WHERE id = ? AND user_id = ?", (goal_id, g.user['id'])
    ).fetchone()
    if not goal:
        conn.close()
        return jsonify({'error': 'Savings goal not found'}), 404

    # Return remaining amount to wallet
    if goal['current_amount'] > 0:
        conn.execute(
            "UPDATE wallet SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
            (goal['current_amount'], g.user['id'])
        )
        conn.execute(
            "INSERT INTO wallet_history (id, user_id, amount, type, description) VALUES (?,?,?,?,?)",
            (str(uuid.uuid4()), g.user['id'], goal['current_amount'], 'credit',
             f'Savings goal closed: {goal["goal_name"]}')
        )

    conn.execute("DELETE FROM savings WHERE id = ?", (goal_id,))
    conn.commit()
    conn.close()

    return jsonify({'message': f'Savings goal "{goal["goal_name"]}" deleted. ₹{goal["current_amount"]:.2f} returned to wallet.'})
