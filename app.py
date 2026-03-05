# app.py
from flask import Flask, render_template, jsonify
from config import PRODUCTS, PHONE_NUMBER

app = Flask(__name__)

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
