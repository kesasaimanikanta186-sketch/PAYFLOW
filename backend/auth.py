# auth.py - Authentication and user management for PayFlow
from flask import Blueprint, request, g, jsonify
from database import get_db
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
from functools import wraps

auth_bp = Blueprint('auth', __name__)


# -- Middleware --

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Token required'}), 401

        db = get_db()
        session = db.execute("SELECT user_id FROM sessions WHERE token = ?", (token,)).fetchone()
        if not session:
            db.close()
            return jsonify({'error': 'Invalid token'}), 401

        user = db.execute("SELECT * FROM users WHERE id = ?", (session['user_id'],)).fetchone()
        db.close()
        if not user:
            return jsonify({'error': 'User not found'}), 401
        if user['is_blocked']:
            return jsonify({'error': 'Account is blocked'}), 403

        g.user = dict(user)
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Token required'}), 401

        db = get_db()
        session = db.execute("SELECT user_id FROM sessions WHERE token = ?", (token,)).fetchone()
        if not session:
            db.close()
            return jsonify({'error': 'Invalid token'}), 401

        user = db.execute("SELECT * FROM users WHERE id = ?", (session['user_id'],)).fetchone()
        db.close()
        if not user:
            return jsonify({'error': 'User not found'}), 401
        if user['role'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403

        g.user = dict(user)
        return f(*args, **kwargs)
    return decorated


def format_user(user):
    return {
        'id': user['id'],
        'name': user['name'],
        'email': user['email'],
        'mobile': user['mobile'],
        'upi_id': user['upi_id'],
        'balance': user['balance'],
        'role': user['role'],
        'is_blocked': user['is_blocked'],
        'created_at': user['created_at']
    }


# -- Routes --

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    mobile = data.get('mobile', '').strip()
    password = data.get('password', '')
    upi_pin = data.get('upi_pin', '').strip()

    if not all([name, email, mobile, password, upi_pin]):
        return jsonify({'error': 'All fields are required'}), 400
    if len(mobile) != 10 or not mobile.isdigit():
        return jsonify({'error': 'Mobile must be 10 digits'}), 400
    if len(upi_pin) != 4 or not upi_pin.isdigit():
        return jsonify({'error': 'UPI PIN must be 4 digits'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    db = get_db()
    existing = db.execute("SELECT id FROM users WHERE email = ? OR mobile = ?", (email, mobile)).fetchone()
    if existing:
        db.close()
        return jsonify({'error': 'Email or mobile already registered'}), 400

    user_id = str(uuid.uuid4())
    upi_id = mobile + '@payflow'
    hashed_pw = generate_password_hash(password)
    token = str(uuid.uuid4())

    db.execute(
        "INSERT INTO users (id, name, email, mobile, password, upi_id, upi_pin, balance, role) VALUES (?,?,?,?,?,?,?,?,?)",
        (user_id, name, email, mobile, hashed_pw, upi_id, upi_pin, 1000.0, 'user')
    )
    db.execute("INSERT INTO sessions (token, user_id) VALUES (?,?)", (token, user_id))
    db.commit()

    user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    db.close()

    return jsonify({'token': token, 'user': format_user(user), 'message': 'Registration successful! Welcome bonus of 1000 added.'}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400

    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

    if not user or not check_password_hash(user['password'], password):
        db.close()
        return jsonify({'error': 'Invalid email or password'}), 401

    if user['is_blocked']:
        db.close()
        return jsonify({'error': 'Account is blocked. Contact admin.'}), 403

    token = str(uuid.uuid4())
    db.execute("INSERT INTO sessions (token, user_id) VALUES (?,?)", (token, user['id']))
    db.commit()
    db.close()

    return jsonify({'token': token, 'user': format_user(user)})


@auth_bp.route('/profile', methods=['GET'])
@login_required
def get_profile():
    return jsonify({'user': format_user(g.user)})


@auth_bp.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    data = request.get_json()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()

    if not name or not email:
        return jsonify({'error': 'Name and email required'}), 400

    db = get_db()
    existing = db.execute("SELECT id FROM users WHERE email = ? AND id != ?", (email, g.user['id'])).fetchone()
    if existing:
        db.close()
        return jsonify({'error': 'Email already in use'}), 400

    db.execute("UPDATE users SET name = ?, email = ? WHERE id = ?", (name, email, g.user['id']))
    db.commit()
    user = db.execute("SELECT * FROM users WHERE id = ?", (g.user['id'],)).fetchone()
    db.close()

    return jsonify({'user': format_user(user), 'message': 'Profile updated'})


@auth_bp.route('/change-password', methods=['PUT'])
@login_required
def change_password():
    data = request.get_json()
    current = data.get('current_password', '')
    new_pw = data.get('new_password', '')

    if not current or not new_pw:
        return jsonify({'error': 'Both passwords required'}), 400
    if len(new_pw) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400
    if not check_password_hash(g.user['password'], current):
        return jsonify({'error': 'Current password is incorrect'}), 400

    db = get_db()
    db.execute("UPDATE users SET password = ? WHERE id = ?", (generate_password_hash(new_pw), g.user['id']))
    db.commit()
    db.close()

    return jsonify({'message': 'Password changed successfully'})


@auth_bp.route('/change-pin', methods=['PUT'])
@login_required
def change_pin():
    data = request.get_json()
    current_pin = data.get('current_pin', '')
    new_pin = data.get('new_pin', '')

    if not current_pin or not new_pin:
        return jsonify({'error': 'Both PINs required'}), 400
    if len(new_pin) != 4 or not new_pin.isdigit():
        return jsonify({'error': 'New PIN must be 4 digits'}), 400
    if g.user['upi_pin'] != current_pin:
        return jsonify({'error': 'Current PIN is incorrect'}), 400

    db = get_db()
    db.execute("UPDATE users SET upi_pin = ? WHERE id = ?", (new_pin, g.user['id']))
    db.commit()
    db.close()

    return jsonify({'message': 'UPI PIN changed successfully'})


@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    db = get_db()
    db.execute("DELETE FROM sessions WHERE token = ?", (token,))
    db.commit()
    db.close()
    return jsonify({'message': 'Logged out successfully'})


@auth_bp.route('/users/search', methods=['GET'])
@login_required
def search_users():
    query = request.args.get('q', '').strip()
    if len(query) < 2:
        return jsonify({'users': []})

    db = get_db()
    users = db.execute(
        "SELECT id, name, email, mobile, upi_id FROM users WHERE role != 'admin' AND id != ? AND (name LIKE ? OR upi_id LIKE ? OR mobile LIKE ?) LIMIT 10",
        (g.user['id'], f'%{query}%', f'%{query}%', f'%{query}%')
    ).fetchall()
    db.close()

    return jsonify({'users': [dict(u) for u in users]})


@auth_bp.route('/users/recent', methods=['GET'])
@login_required
def recent_contacts():
    db = get_db()
    contacts = db.execute('''
        SELECT DISTINCT u.id, u.name, u.upi_id, u.mobile
        FROM transactions t
        JOIN users u ON (u.id = t.receiver AND t.sender = ?) OR (u.id = t.sender AND t.receiver = ?)
        WHERE u.id != ?
        ORDER BY t.date_time DESC
        LIMIT 5
    ''', (g.user['id'], g.user['id'], g.user['id'])).fetchall()
    db.close()

    return jsonify({'contacts': [dict(c) for c in contacts]})
