import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProductDetailCard = React.memo(({ slide }) => {
    if (!slide) return null;

    return (
        <div className="product-detail-card product-detail-card--solid">
            <div className="product-card-header">
                <span className="product-category">{slide.tag}</span>
                {slide.badge ? <div className="product-badge-mini">{slide.badge}</div> : null}
            </div>

            <h4 className="product-card-title">{slide.title}</h4>

            <div className="product-card-rating">
                <span className="stars">★★★★★</span>
                <span className="review-count">(1,245)</span>
            </div>

            <div className="product-card-price">
                <span className="price-current">{slide.price}</span>
                {slide.oldPrice ? <span className="price-old">{slide.oldPrice}</span> : null}
            </div>

            <p className="product-card-description">{slide.description}</p>
            {slide.detail ? <div className="product-card-specs">{slide.detail}</div> : null}
        </div>
    );
});
ProductDetailCard.displayName = "ProductDetailCard";

// ✅ Static RIGHT copy
const HeroCopyRight = React.memo(({ onShop }) => {
    return (
        <div className="hero-text-section hero-text-section--right">
            <div className="hero-kicker">🔥 New drops • Limited stock</div>

            <h1 className="hero-main-title">
                Discover Premium <span className="hero-highlight">Technology</span>
            </h1>

            <p className="hero-subtitle">
                Curated collection of the finest tech products for modern living.
            </p>

            <div className="hero-cta">
                <button className="btn btn-primary btn-hero btn-hero-primary" onClick={onShop}>
                    Explore Collection <ArrowRight size={18} style={{ marginLeft: 8 }} />
                </button>

                <button className="btn btn-hero btn-hero-secondary" onClick={onShop}>
                    Shop Deals
                </button>
            </div>

            <div className="hero-proof">
                <div className="hero-proof-item">
                    <strong>4.8★</strong>
                    <span>avg rating</span>
                </div>
                <div className="hero-proof-item">
                    <strong>24h</strong>
                    <span>delivery</span>
                </div>
                <div className="hero-proof-item">
                    <strong>7-day</strong>
                    <span>returns</span>
                </div>
            </div>
        </div>
    );
});
HeroCopyRight.displayName = "HeroCopyRight";

export default function Hero() {
    const navigate = useNavigate();

    // ✅ your static slides
    const slides = useMemo(
        () => [
            {
                id: "macbook",
                tag: "Computers",
                title: "MacBook Pro M3 Max",
                description:
                    "Pure performance for creators — fast renders, smooth multitasking, zero stress.",
                price: "$2,499.00",
                oldPrice: "$2,999.00",
                badge: "15% OFF",
                image: "/assets/macbook_hero.png",
                detail: "M3 Max Chip | 128GB Unified Memory",
            },
            {
                id: "headset",
                tag: "Audio",
                title: "Noise-Canceling Headset",
                description:
                    "Block the world. Keep the music. Perfect for focus, travel, and main-character mode.",
                price: "$349.00",
                oldPrice: "$399.00",
                badge: "Deal ⚡",
                image: "/assets/headset_hero.png",
                detail: "40mm Drivers | 60h Battery Life",
            },
        ],
        []
    );

    const [currentSlide, setCurrentSlide] = useState(0);
    const [paused, setPaused] = useState(false);

    // Preload images
    useEffect(() => {
        slides.forEach((s) => {
            if (!s?.image) return;
            const img = new Image();
            img.src = s.image;
        });
    }, [slides]);

    // Auto rotate (pause on hover)
    useEffect(() => {
        if (!slides.length || paused) return;

        const timer = setInterval(() => {
            setCurrentSlide((p) => (p + 1) % slides.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [slides.length, paused]);

    const active = slides[currentSlide];

    if (!slides.length) return null;

    return (
        <section className="hero">
            <div className="hero-reference-layout hero-reference-layout--flip">
                {/* RIGHT (static) */}
                <HeroCopyRight onShop={() => navigate("/shop")} />

                {/* LEFT (dynamic only) */}
                <div className="hero-product-image-area">
                    <div
                        className="hero-product-stage"
                        onMouseEnter={() => setPaused(true)}
                        onMouseLeave={() => setPaused(false)}
                    >


                        {/* carousel = images only */}
                        <div className="hero-carousel hero-carousel--stage">
                            <div
                                className="hero-carousel-track hero-carousel-track--stage"
                                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                            >
                                {slides.map((s) => (
                                    <div className="hero-carousel-slide hero-carousel-slide--stage" key={s.id}>
                                        <div className="product-image-wrapper product-image-wrapper--full">
                                            <img
                                                src={s.image}
                                                alt={s.title}
                                                className={`hero-main-product hero-main-product--clean product-${s.id}`}
                                                loading="eager"
                                                decoding="async"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* dots */}
                        {/* vertical dots (far right) */}
                        <div className="hero-dots hero-dots--vertical">
                            {slides.map((_, idx) => (
                                <button
                                    key={idx}
                                    className={`hero-dot ${idx === currentSlide ? "active" : ""}`}
                                    onClick={() => setCurrentSlide(idx)}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>

                        {/* overlay card */}
                        <div className="hero-card-overlay">
                            <ProductDetailCard slide={active} />
                        </div>
                    </div>
                </div>

                {/* optional hidden hook
                <div style={{ display: "none" }}>{active?.id}</div> */}
            </div>
        </section>
    );
}
