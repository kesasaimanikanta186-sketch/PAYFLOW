# bank_accounts.py - Bank account management for PayFlow
import uuid
from flask import Blueprint, request, jsonify, g
from auth import login_required
from database import get_db

bank_accounts_bp = Blueprint('bank_accounts', __name__)


@bank_accounts_bp.route('', methods=['GET'])
@login_required
def get_accounts():
    db = get_db()
    accounts = db.execute(
        "SELECT * FROM bank_accounts WHERE user_id = ? ORDER BY is_primary DESC, created_at DESC",
        (g.user['id'],)
    ).fetchall()
    db.close()
    return jsonify({'accounts': [dict(a) for a in accounts]})


@bank_accounts_bp.route('', methods=['POST'])
@login_required
def add_account():
    data = request.get_json()

    if not data.get('bank_name') or not data.get('account_number') or not data.get('ifsc'):
        return jsonify({'error': 'bank_name, account_number, and ifsc are required'}), 400

    db = get_db()

    existing = db.execute(
        "SELECT id FROM bank_accounts WHERE user_id = ? AND account_number = ?",
        (g.user['id'], data['account_number'])
    ).fetchone()
    if existing:
        db.close()
        return jsonify({'error': 'Account already linked'}), 409

    count = db.execute("SELECT COUNT(*) as c FROM bank_accounts WHERE user_id = ?", (g.user['id'],)).fetchone()['c']
    is_primary = 1 if count == 0 else 0

    account_id = str(uuid.uuid4())
    db.execute(
        "INSERT INTO bank_accounts (id, user_id, bank_name, account_number, ifsc, is_primary) VALUES (?,?,?,?,?,?)",
        (account_id, g.user['id'], data['bank_name'], data['account_number'], data['ifsc'], is_primary)
    )
    db.commit()
    db.close()

    return jsonify({
        'message': 'Bank account added',
        'account': {
            'id': account_id, 'bank_name': data['bank_name'],
            'account_number': data['account_number'], 'ifsc': data['ifsc'],
            'is_primary': is_primary
        }
    }), 201


@bank_accounts_bp.route('/<account_id>/primary', methods=['PUT'])
@login_required
def set_primary(account_id):
    db = get_db()

    account = db.execute(
        "SELECT id FROM bank_accounts WHERE id = ? AND user_id = ?", (account_id, g.user['id'])
    ).fetchone()
    if not account:
        db.close()
        return jsonify({'error': 'Account not found'}), 404

    db.execute("UPDATE bank_accounts SET is_primary = 0 WHERE user_id = ?", (g.user['id'],))
    db.execute("UPDATE bank_accounts SET is_primary = 1 WHERE id = ?", (account_id,))
    db.commit()
    db.close()

    return jsonify({'message': 'Primary account updated'})


@bank_accounts_bp.route('/<account_id>', methods=['DELETE'])
@login_required
def remove_account(account_id):
    db = get_db()

    account = db.execute(
        "SELECT id, is_primary FROM bank_accounts WHERE id = ? AND user_id = ?", (account_id, g.user['id'])
    ).fetchone()
    if not account:
        db.close()
        return jsonify({'error': 'Account not found'}), 404

    db.execute("DELETE FROM bank_accounts WHERE id = ?", (account_id,))

    if account['is_primary']:
        next_acc = db.execute("SELECT id FROM bank_accounts WHERE user_id = ? LIMIT 1", (g.user['id'],)).fetchone()
        if next_acc:
            db.execute("UPDATE bank_accounts SET is_primary = 1 WHERE id = ?", (next_acc['id'],))

    db.commit()
    db.close()

    return jsonify({'message': 'Bank account removed'})
