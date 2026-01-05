import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RegistrationModal.css';

const RegistrationModal = ({ onRegister, onSkip }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone_number: '',
        avatar_url: '',
        location: 'Detecting...'
    });

    const avatars = [
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Aiden',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Caleb',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Shadow',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Lily',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack'
    ];

    useEffect(() => {
        // Determine Location Automatically
        const fetchLocation = async () => {
            try {
                const res = await axios.get('https://ipapi.co/json/');
                setFormData(prev => ({ ...prev, location: `${res.data.city}, ${res.data.country_name}` }));
            } catch (err) {
                setFormData(prev => ({ ...prev, location: 'Global Boutique' }));
            }
        };
        fetchLocation();

        // Set default avatar
        setFormData(prev => ({ ...prev, avatar_url: avatars[0] }));
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        onRegister(formData);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content registration-modal glass fade-in">
                <h2>Boutique Membership</h2>
                <p>Your unique style, recognized globally. We've detected your location as <strong>{formData.location}</strong>.</p>

                <form onSubmit={handleSubmit}>
                    <div className="avatar-selection">
                        <p className="selection-label">Choose your Boutique Identity:</p>
                        <div className="avatar-list">
                            {avatars.map((url, i) => (
                                <div
                                    key={i}
                                    className={`avatar-option ${formData.avatar_url === url ? 'selected' : ''}`}
                                    onClick={() => setFormData({ ...formData, avatar_url: url })}
                                >
                                    <img src={url} alt={`Avatar ${i}`} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="Username"
                            required
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        <input
                            type="tel"
                            placeholder="Phone Number"
                            required
                            value={formData.phone_number}
                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary">Join the Boutique</button>
                    <button type="button" className="btn btn-secondary" onClick={onSkip} style={{ marginTop: '10px' }}>
                        Continue as Guest
                    </button>
                </form>
                <p style={{ marginTop: '15px', fontStyle: 'italic', fontSize: '0.8rem', opacity: 0.7 }}>
                    * Membership unlocks purchasing, reviews, and a personalized experience.
                </p>
            </div>
        </div>
    );
};

export default RegistrationModal;
