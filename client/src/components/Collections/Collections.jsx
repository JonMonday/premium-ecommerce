import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../App';
import { ArrowUpRight, ThumbsUp, Star } from 'lucide-react';
import './Collections.css';

const Collections = () => {
    const { API_URL, likes, toggleLike } = useAppContext();
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCollections = async () => {
            try {
                const res = await axios.get(`${API_URL}/collections`);
                setCollections(res.data || []);
            } catch (err) {
                console.error('Error fetching collections:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCollections();
    }, [API_URL]);

    const handleLike = (e, id) => {
        e.stopPropagation();
        toggleLike('collection', id);
    };

    if (loading || collections.length === 0) return null;

    return (
        <section className="collections container section-padding">
            <div className="section-header">
                <h2 className="section-title">Exclusive Collections</h2>
                <p className="section-subtitle">Curated drops for the discerning individual.</p>
            </div>

            <div className="collections-grid">
                {collections.map((col) => {
                    const isLiked = likes.collections.includes(col.id);
                    return (
                        <div
                            key={col.id}
                            className="collection-card glass-morphism"
                            onClick={() => navigate(`/shop?collection_id=${col.id}`)}
                        >
                            <div className="collection-image-wrapper">
                                <img src={col.banner_image} alt={col.name} className="collection-banner" />
                                <div className="collection-overlay">
                                    <span className="collection-tag">Featured</span>
                                    <button
                                        className={`collection-like ${isLiked ? 'active' : ''}`}
                                        onClick={(e) => handleLike(e, col.id)}
                                    >
                                        <ThumbsUp size={16} fill={isLiked ? "currentColor" : "none"} />
                                    </button>
                                </div>
                            </div>
                            <div className="collection-content">
                                <div className="collection-meta">
                                    <h3 className="collection-name">{col.name}</h3>
                                    <div className="collection-rating">
                                        <Star size={14} fill="#ff9900" color="#ff9900" />
                                        <span>{Number(col.average_rating || 0).toFixed(1)} ({col.review_count})</span>
                                    </div>
                                </div>
                                <p className="collection-description">{col.description}</p>
                                <button className="collection-link">
                                    Explore Collection <ArrowUpRight size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};


export default Collections;
