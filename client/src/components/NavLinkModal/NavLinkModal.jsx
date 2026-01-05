import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../../App';
import { Star } from 'lucide-react';
import './NavLinkModal.css';

const NavLinkModal = ({
    open,
    topOffset = 0,
    optionName,
    onMouseEnter,
    onMouseLeave,
    onClose,
    onPickCategory,
}) => {
    const { API_URL } = useAppContext();
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [activeOptionId, setActiveOptionId] = useState(null);

    useEffect(() => {
        if (!open) return;
        fetchOptions();
        const firstOpt = options[0];
        setActiveOptionId(firstOpt?.id ?? null);
    }, [API_URL, open]);

    const fetchOptions = async () => {
        try {
            const res = await axios.get(`${API_URL}/${optionName}`);
            setOptions(res.data || []);
        } catch (err) {
            console.error('Error fetching collections:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading || options.length === 0) return null;

    if (!open) return null;

    const handleOptionHover = (opt) => {
        setActiveOptionId(opt.id);
    };

    const previewImage =
        options.find((o) => o.id === activeOptionId)?.banner_image || "/assets/defaultCollection.jpg";

    return (
        <div
            className="nav-modal-menu"
            style={{ top: topOffset }}
            role="dialog"
            aria-label={optionName}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="nav-modal-menu-inner">

                <div className="nav-modal-menu-cols">
                    {/* LEFT: options */}
                    <div className="nav-modal-menu-left">
                        <div className="nav-modal-col">
                            <div className="nav-modal-col-title">{optionName}</div>

                            <div className="nav-modal-list">
                                {options.map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        className={`nav-modal-item`}
                                        onMouseEnter={() => handleOptionHover(opt)}
                                        onFocus={() => handleOptionHover(opt)}
                                        onClick={() => onPickCategory(opt.id)}
                                    >
                                        <span className="nav-modal-item-text">{opt.name ?? opt.title}</span>
                                        <span className="nav-modal-item-subtext">{opt.description}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Preview */}
                    <div className="nav-modal-menu-right">
                        <div className="nav-modal-preview-card">
                            <div className="nav-modal-preview-media">
                                {previewImage ? (
                                        <img src={previewImage} alt={options.find((o) => o.id === activeOptionId)?.name || 'Preview product'} loading="lazy" decoding="async" />
                                    ) : (
                                        <div className="nav-modal-preview-skeleton" />
                                    )}
                                <div className="nav-modal-preview-rating">
                                    <div className="stars">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={14}
                                                fill={i < Math.floor(options.find((o) => o.id === activeOptionId)?.average_rating) ? "#ff9900" : "none"}
                                                color="#ff9900"
                                            />
                                        ))}
                                    </div>
                                    <span className="nav-modal-preview-review-count">({options.find((o) => o.id === activeOptionId)?.review_count?.toLocaleString()})</span>
                                </div>
                            </div>

                            {/* <div className="nav-modal-preview-body">
                                <div className="nav-modal-preview-title">
                                    {loading ? 'Loading…' : options.find((o) => o.id === activeOptionId)?.name || 'Exclusive Collection'}
                                </div>
                                <div className="nav-modal-preview-text">
                                    {loading
                                        ? 'Finding the best match…'
                                        : options.find((o) => o.id === activeOptionId)?.description || 'Beautify collection description'}
                                </div>
                            </div> */}
                        </div>
                    </div>
                </div>

                <button className="nav-modal-menu-close" type="button" onClick={onClose} aria-label="Close filter">
                    ✕
                </button>
            </div>
        </div>
    );
};

export default NavLinkModal;
