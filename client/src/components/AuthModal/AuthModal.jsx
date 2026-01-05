import React, { useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../../App';
import './AuthModal.css';

const AuthModal = ({ onClose, onAuthenticated }) => {
    const { API_URL } = useAppContext();
    const [step, setStep] = useState(1); // 1: Email/Phone, 2: OTP
    const [contact, setContact] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [receivedOtp, setReceivedOtp] = useState(''); // Only for dev simulation

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const isEmail = contact.includes('@');
            const payload = isEmail ? { email: contact } : { phone_number: contact };
            payload.device_id = localStorage.getItem('boutique_device_id');

            const res = await axios.post(`${API_URL}/auth/otp-request`, payload);
            setReceivedOtp(res.data.otp); // Capture OTP for simulation
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const isEmail = contact.includes('@');
            const payload = isEmail ? { email: contact } : { phone_number: contact };
            payload.otp = otp;

            const res = await axios.post(`${API_URL}/auth/otp-verify`, payload);
            if (res.data.success) {
                onAuthenticated(res.data.user);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay auth-modal-overlay">
            <div className="modal-content auth-modal">
                <button className="close-btn" onClick={onClose}>&times;</button>

                <div className="auth-header">
                    <h2>{step === 1 ? 'Welcome to Premium' : 'Verify Identity'}</h2>
                    <p>{step === 1 ? 'Sign in or create an account to continue' : `Enter the 6-digit code sent to ${contact}`}</p>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleRequestOtp}>
                        <div className="form-group">
                            <label>Email or Phone Number</label>
                            <input
                                type="text"
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                                placeholder="alex@example.com or +1234567890"
                                required
                            />
                        </div>
                        {error && <p className="error-msg">{error}</p>}
                        <button type="submit" className="primary-btn" disabled={loading}>
                            {loading ? 'Sending...' : 'Continue'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp}>
                        <div className="form-group">
                            <label>6-Digit Code</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="000000"
                                maxLength={6}
                                required
                            />
                        </div>
                        {receivedOtp && (
                            <div className="dev-otp-hint">
                                <p>Development Hint: Your OTP is <strong>{receivedOtp}</strong></p>
                            </div>
                        )}
                        {error && <p className="error-msg">{error}</p>}
                        <button type="submit" className="primary-btn" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify & Sign In'}
                        </button>
                        <button type="button" className="text-btn" onClick={() => setStep(1)}>
                            Change Email/Phone
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AuthModal;
