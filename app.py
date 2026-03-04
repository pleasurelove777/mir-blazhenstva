# app.py
import os
from flask import Flask, render_template, jsonify
from config import PRODUCTS, PHONE_NUMBER

app = Flask(__name__)

# 🔥 Порт из переменной окружения (требование Render)
port = int(os.environ.get("PORT", 5000))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/products')
def get_products():
    return jsonify(PRODUCTS)

@app.route('/api/product/<int:product_id>')
def get_product(product_id):
    product = next((p for p in PRODUCTS if p['id'] == product_id), None)
    if product:
        return jsonify(product)
    return jsonify({'error': 'Product not found'}), 404

@app.route('/api/phone')
def get_phone():
    return jsonify({'phone': PHONE_NUMBER})

if __name__ == '__main__':
    # 🔥 debug=False для продакшена
    app.run(debug=False, host='0.0.0.0', port=port)