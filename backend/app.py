# app.py - Main Flask application for PayFlow
from flask import Flask
from flask_cors import CORS
from database import init_db

from auth import auth_bp
from transactions import transactions_bp
from bank_accounts import bank_accounts_bp
from admin import admin_bp

app = Flask(__name__)
app.config['SECRET_KEY'] = 'payflow-secret-key-2024'

CORS(app, resources={r"/api/*": {"origins": "*"}})

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
app.register_blueprint(bank_accounts_bp, url_prefix='/api/bank-accounts')
app.register_blueprint(admin_bp, url_prefix='/api/admin')


@app.route('/api/health')
def health_check():
    return {'status': 'ok', 'message': 'PayFlow API is running'}


if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
