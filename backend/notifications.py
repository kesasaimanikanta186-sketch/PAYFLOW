# notifications.py - Notification routes for PayFlow
from flask import Blueprint, request, jsonify, g
from auth import login_required
from database import get_db

notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route('', methods=['GET'])
@login_required
def get_notifications():
    """Get all notifications for the user"""
    conn = get_db()
    notifications = conn.execute(
        "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
        (g.user['id'],)
    ).fetchall()

    unread_count = conn.execute(
        "SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0",
        (g.user['id'],)
    ).fetchone()[0]

    conn.close()

    return jsonify({
        'notifications': [dict(n) for n in notifications],
        'unread_count': unread_count
    })


@notifications_bp.route('/<notif_id>/read', methods=['PUT'])
@login_required
def mark_read(notif_id):
    """Mark a single notification as read"""
    conn = get_db()
    conn.execute(
        "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
        (notif_id, g.user['id'])
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Notification marked as read'})


@notifications_bp.route('/read-all', methods=['PUT'])
@login_required
def mark_all_read():
    """Mark all notifications as read"""
    conn = get_db()
    conn.execute(
        "UPDATE notifications SET is_read = 1 WHERE user_id = ?",
        (g.user['id'],)
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'All notifications marked as read'})


@notifications_bp.route('/unread-count', methods=['GET'])
@login_required
def unread_count():
    """Get count of unread notifications"""
    conn = get_db()
    count = conn.execute(
        "SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0",
        (g.user['id'],)
    ).fetchone()[0]
    conn.close()
    return jsonify({'count': count})
