import React from 'react';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container footer-grid">
                <div className="footer-section about">
                    <h3 className="logo">BOUTIQUE</h3>
                    <p>Curation of the world's finest products, delivered with premium care to your doorstep.</p>
                    <div className="social-links">
                        <a href="#"><Instagram size={20} /></a>
                        <a href="#"><Facebook size={20} /></a>
                        <a href="#"><Twitter size={20} /></a>
                    </div>
                </div>

                <div className="footer-section links">
                    <h4>SHOP</h4>
                    <ul>
                        <li><a href="#">Computers</a></li>
                        <li><a href="#">Electronics</a></li>
                        <li><a href="#">Fashion</a></li>
                        <li><a href="#">Home & Kitchen</a></li>
                    </ul>
                </div>

                <div className="footer-section links">
                    <h4>SUPPORT</h4>
                    <ul>
                        <li><a href="#">Shipping Policy</a></li>
                        <li><a href="#">Returns & Refunds</a></li>
                        <li><a href="#">Privacy Policy</a></li>
                        <li><a href="#">Terms of Service</a></li>
                    </ul>
                </div>

                <div className="footer-section contact">
                    <h4>CONTACT US</h4>
                    <div className="contact-item">
                        <MapPin size={18} />
                        <span>123 Premium Way, Luxury City, 90210</span>
                    </div>
                    <div className="contact-item">
                        <Phone size={18} />
                        <span>+1 (800) BOUTIQUE</span>
                    </div>
                    <div className="contact-item">
                        <Mail size={18} />
                        <span>concierge@premium-boutique.com</span>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <div className="container">
                    <p>&copy; 2025 Premium Boutique. Built for Excellence.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
