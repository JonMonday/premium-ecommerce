import React from 'react';
import { X, Trash2, Download } from 'lucide-react';
import './Cart.css';

const Cart = ({ cart, isOpen, onClose, onRemove, onCheckout }) => {
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const tax = total * 0.08;
    const shipping = total > 500 ? 0 : 25;
    const finalTotal = total + tax + shipping;

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content cart-modal glass fade-in" onClick={e => e.stopPropagation()}>
                <div className="cart-header">
                    <h2>Your Collection ({cart.length})</h2>
                    <button className="close-btn" onClick={onClose}><X /></button>
                </div>

                <div className="cart-items">
                    {cart.length === 0 ? (
                        <p className="empty-cart-msg">Your collection is empty. Discover something beautiful.</p>
                    ) : (
                        cart.map((item, index) => (
                            <div key={index} className="cart-item">
                                <img src={item.images[0]} alt={item.name} />
                                <div className="cart-item-info">
                                    <h4>{item.name}</h4>
                                    <p>${item.price.toFixed(2)}</p>
                                </div>
                                <button className="remove-btn" onClick={() => onRemove(index)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="cart-footer">
                        <div className="price-breakdown">
                            <div className="breakdown-item">
                                <span>Subtotal</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                            <div className="breakdown-item">
                                <span>Premium Care (Tax 8%)</span>
                                <span>${tax.toFixed(2)}</span>
                            </div>
                            <div className="breakdown-item">
                                <span>Insured Shipping</span>
                                <span>{shipping === 0 ? 'COMPLIMENTARY' : `$${shipping.toFixed(2)}`}</span>
                            </div>
                            <div className="cart-total">
                                <span>ESTIMATED TOTAL</span>
                                <span>${finalTotal.toFixed(2)}</span>
                            </div>
                        </div>
                        <button className="btn btn-primary checkout-btn" onClick={onCheckout}>
                            Proceed to Boutique Checkout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;
