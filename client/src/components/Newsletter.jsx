import React, { useState } from 'react';
import { Send } from 'lucide-react';

const Newsletter = () => {
    const [email, setEmail] = useState('');

    const handleSubscribe = (e) => {
        e.preventDefault();
        alert(`Thank you for subscribing with ${email}! Exclusive rewards are coming your way.`);
        setEmail('');
    };

    return (
        <section className="newsletter glass">
            <div className="newsletter-content">
                <div className="newsletter-text">
                    <h3>JOIN THE BOUTIQUE CLUB</h3>
                    <p>Subscribe to receive updates, access to exclusive deals, and more.</p>
                </div>
                <form className="newsletter-form" onSubmit={handleSubscribe}>
                    <input
                        type="email"
                        placeholder="Enter your email address"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className='newsletter-input'
                    />
                    <button type="submit" className="btn btn-primary newsletter-btn">
                        Subscribe
                    </button>
                </form>
            </div>
        </section>
    );
};

export default Newsletter;
