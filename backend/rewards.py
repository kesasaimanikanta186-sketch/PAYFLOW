# rewards.py - Rewards and cashback system for PayFlow
import uuid
from flask import Blueprint, request, jsonify, g
from auth import login_required
from database import get_db

rewards_bp = Blueprint('rewards', __name__)


@rewards_bp.route('', methods=['GET'])
@login_required
def get_rewards():
    """Get all rewards for the user"""
    conn = get_db()
    rewards = conn.execute(
        "SELECT * FROM rewards WHERE user_id = ? ORDER BY created_at DESC",
        (g.user['id'],)
    ).fetchall()
    conn.close()
    return jsonify({'rewards': [dict(r) for r in rewards]})


@rewards_bp.route('/summary', methods=['GET'])
@login_required
def rewards_summary():
    """Get rewards summary (total points, total cashback)"""
    conn = get_db()
    summary = conn.execute(
        """SELECT COALESCE(SUM(points), 0) as total_points,
                  COALESCE(SUM(cashback_amount), 0) as total_cashback,
                  COUNT(*) as total_rewards
           FROM rewards WHERE user_id = ?""",
        (g.user['id'],)
    ).fetchone()
    conn.close()
    return jsonify({'summary': dict(summary)})


@rewards_bp.route('/redeem', methods=['POST'])
@login_required
def redeem_points():
    """Redeem reward points to wallet (10 points = ₹1)"""
    data = request.get_json()
    points_to_redeem = int(data.get('points', 0))

    if points_to_redeem <= 0:
        return jsonify({'error': 'Enter valid points to redeem'}), 400

    conn = get_db()

    # Get total available points
    total = conn.execute(
        "SELECT COALESCE(SUM(points), 0) as total FROM rewards WHERE user_id = ?",
        (g.user['id'],)
    ).fetchone()['total']

    if points_to_redeem > total:
        conn.close()
        return jsonify({'error': 'Insufficient reward points'}), 400

    # Convert points to money (10 points = ₹1)
    amount = points_to_redeem / 10.0

    # Deduct points (add negative entry)
    conn.execute(
        "INSERT INTO rewards (id, user_id, points, cashback_amount, description) VALUES (?,?,?,?,?)",
        (str(uuid.uuid4()), g.user['id'], -points_to_redeem, 0, f'Redeemed {points_to_redeem} points for ₹{amount:.2f}')
    )

    # Add to wallet
    conn.execute(
        "UPDATE wallet SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
        (amount, g.user['id'])
    )
    conn.execute(
        "INSERT INTO wallet_history (id, user_id, amount, type, description) VALUES (?,?,?,?,?)",
        (str(uuid.uuid4()), g.user['id'], amount, 'credit', f'Reward redemption ({points_to_redeem} points)')
    )

    conn.execute(
        "INSERT INTO notifications (id, user_id, title, message, type) VALUES (?,?,?,?,?)",
        (str(uuid.uuid4()), g.user['id'], 'Points Redeemed',
         f'{points_to_redeem} points redeemed. ₹{amount:.2f} added to wallet!', 'reward')
    )

    conn.commit()

    wallet = conn.execute("SELECT balance FROM wallet WHERE user_id = ?", (g.user['id'],)).fetchone()
    conn.close()

    return jsonify({
        'message': f'{points_to_redeem} points redeemed for ₹{amount:.2f}',
        'wallet_balance': wallet['balance']
    })
