# admin.py - Admin panel routes for PayFlow
from flask import Blueprint, request, jsonify, g
from auth import admin_required
from database import get_db

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_all_users():
    db = get_db()
    users = db.execute(
        "SELECT id, name, email, mobile, upi_id, balance, role, is_blocked, created_at FROM users ORDER BY created_at DESC"
    ).fetchall()
    db.close()
    return jsonify({'users': [dict(u) for u in users]})


@admin_bp.route('/users/<user_id>/block', methods=['PUT'])
@admin_required
def block_user(user_id):
    if user_id == g.user['id']:
        return jsonify({'error': 'Cannot block yourself'}), 400

    db = get_db()
    user = db.execute("SELECT id, role FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        db.close()
        return jsonify({'error': 'User not found'}), 404
    if user['role'] == 'admin':
        db.close()
        return jsonify({'error': 'Cannot block admin users'}), 400

    db.execute("UPDATE users SET is_blocked = 1 WHERE id = ?", (user_id,))
    db.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
    db.commit()
    db.close()

    return jsonify({'message': 'User blocked successfully'})


@admin_bp.route('/users/<user_id>/unblock', methods=['PUT'])
@admin_required
def unblock_user(user_id):
    db = get_db()
    db.execute("UPDATE users SET is_blocked = 0 WHERE id = ?", (user_id,))
    db.commit()
    db.close()
    return jsonify({'message': 'User unblocked successfully'})


@admin_bp.route('/transactions', methods=['GET'])
@admin_required
def get_all_transactions():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))
    offset = (page - 1) * per_page

    db = get_db()
    total = db.execute("SELECT COUNT(*) FROM transactions").fetchone()[0]

    txns = db.execute('''
        SELECT t.id, t.sender, t.receiver, t.amount, t.status, t.transaction_id, t.note, t.date_time,
               s.name as sender_name, s.upi_id as sender_upi,
               r.name as receiver_name, r.upi_id as receiver_upi
        FROM transactions t
        LEFT JOIN users s ON t.sender = s.id
        LEFT JOIN users r ON t.receiver = r.id
        ORDER BY t.date_time DESC LIMIT ? OFFSET ?
    ''', (per_page, offset)).fetchall()
    db.close()

    return jsonify({
        'transactions': [dict(t) for t in txns],
        'total': total,
        'page': page,
        'total_pages': (total + per_page - 1) // per_page
    })


@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_admin_stats():
    db = get_db()

    total_users = db.execute("SELECT COUNT(*) FROM users WHERE role != 'admin'").fetchone()[0]
    blocked_users = db.execute("SELECT COUNT(*) FROM users WHERE is_blocked = 1").fetchone()[0]
    active_users = total_users - blocked_users

    total_txns = db.execute("SELECT COUNT(*) FROM transactions").fetchone()[0]
    successful_txns = db.execute("SELECT COUNT(*) FROM transactions WHERE status = 'success'").fetchone()[0]
    failed_txns = db.execute("SELECT COUNT(*) FROM transactions WHERE status = 'failed'").fetchone()[0]
    pending_txns = db.execute("SELECT COUNT(*) FROM transactions WHERE status = 'pending'").fetchone()[0]
    total_volume = db.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE status = 'success'").fetchone()[0]

    monthly_txns = db.execute('''
        SELECT strftime('%Y-%m', date_time) as month,
               COUNT(*) as count,
               SUM(amount) as volume,
               SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
               SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count
        FROM transactions
        GROUP BY month ORDER BY month DESC LIMIT 6
    ''').fetchall()

    monthly_users = db.execute('''
        SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
        FROM users WHERE role != 'admin'
        GROUP BY month ORDER BY month DESC LIMIT 6
    ''').fetchall()

    db.close()

    return jsonify({
        'users': {'total': total_users, 'active': active_users, 'blocked': blocked_users},
        'transactions': {
            'total': total_txns, 'successful': successful_txns,
            'failed': failed_txns, 'pending': pending_txns, 'volume': total_volume
        },
        'monthly_transactions': [dict(m) for m in monthly_txns],
        'monthly_users': [dict(m) for m in monthly_users]
    })
