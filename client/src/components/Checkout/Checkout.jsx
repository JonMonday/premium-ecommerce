import React, { useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { Download, CheckCircle } from 'lucide-react';
import './Checkout.css';

const Checkout = ({ cart, user, onClose, onComplete, API_URL }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderId, setOrderId] = useState(null);

    const total = cart.reduce((sum, item) => sum + item.price, 0);

    if (!user) {
        return (
            <div className="modal-overlay">
                <div className="modal-content glass fade-in">
                    <div className="modal-header">
                        <h2>Registration Required</h2>
                    </div>
                    <p style={{ margin: '30px 0' }}>You must be a registered member to place an order at the Boutique.</p>
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => window.location.reload()}>
                        Register Now
                    </button>
                    <button className="btn btn-secondary" style={{ width: '100%', marginTop: '10px' }} onClick={onClose}>
                        Continue Browsing
                    </button>
                </div>
            </div>
        );
    }

    const handleCheckout = async () => {
        setIsProcessing(true);
        try {
            const res = await axios.post(`${API_URL}/orders`, {
                device_id: user.device_id,
                total_amount: total,
                items: cart.map(item => ({ id: item.id, quantity: 1, price: item.price }))
            });
            setOrderId(res.data.orderId);
            setOrderSuccess(true);
            onComplete();
        } catch (err) {
            alert('Order processing failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const generateInvoice = () => {
        const doc = new jsPDF();

        doc.setFontSize(22);
        doc.text('BOUTIQUE INVOICE', 20, 20);

        doc.setFontSize(12);
        doc.text(`Order ID: ${orderId}`, 20, 40);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);
        doc.text(`Customer: ${user.username}`, 20, 60);
        doc.text(`Email: ${user.email}`, 20, 70);
        doc.text(`Phone: ${user.phone_number}`, 20, 80);

        doc.text('--------------------------------------------------', 20, 90);

        let y = 100;
        cart.forEach((item, i) => {
            doc.text(`${i + 1}. ${item.name}`, 20, y);
            doc.text(`$${item.price.toFixed(2)}`, 160, y);
            y += 10;
        });

        doc.text('--------------------------------------------------', 20, y);
        y += 10;
        doc.setFontSize(14);
        doc.text('TOTAL', 20, y);
        doc.text(`$${total.toFixed(2)}`, 160, y);

        doc.setFontSize(10);
        doc.text('Thank you for shopping at Premium Boutique!', 20, y + 20);

        doc.save(`invoice_${orderId}.pdf`);
    };

    if (orderSuccess) {
        return (
            <div className="modal-overlay">
                <div className="modal-content glass fade-in text-center">
                    <CheckCircle size={60} color="#4bb543" style={{ margin: '0 auto 20px' }} />
                    <h2>Order Placed Successfully!</h2>
                    <p>Your order #{orderId} has been confirmed. A notification has been sent to {user.email}.</p>
                    <div className="success-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button className="btn btn-primary" onClick={generateInvoice}>
                            <Download size={18} /> Download Invoice
                        </button>
                        <button className="btn btn-secondary" onClick={onClose}>
                            Return to Store
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass fade-in" onClick={e => e.stopPropagation()}>
                <h2>Review Your Order</h2>
                <div className="checkout-summary">
                    <p>Confirming order for: <strong>{user.username}</strong></p>
                    <p>Phone: {user.phone_number}</p>
                    <div className="checkout-total">
                        <span>Total to Pay:</span>
                        <strong>${total.toFixed(2)}</strong>
                    </div>
                </div>
                <button
                    className="btn btn-primary checkout-btn"
                    onClick={handleCheckout}
                    disabled={isProcessing}
                >
                    {isProcessing ? 'Processing boutique order...' : 'Confirm Order'}
                </button>
                <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: '10px', width: '100%' }}>
                    Back to Collection
                </button>
            </div>
        </div>
    );
};

export default Checkout;
