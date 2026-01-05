import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../App";
import axios from "axios";
import "./Hero.css";

const DEFAULT_IMG = "/assets/defaultCollection.jpg";

const HeroCopyRight = React.memo(({ onShop }) => {
  return (
    <div className="hero-text-section hero-text-section--left">
      <div className="hero-kicker">✨ Seasonal Arrivals • Signature Style</div>

      <h1 className="hero-main-title">
        Discover Premium <span className="hero-highlight">Fashion</span>
      </h1>

      <p className="hero-subtitle">
        Curated collection of the finest designer apparel and accessories for a sophisticated lifestyle.
      </p>

      <div className="hero-cta">
        <button className="btn btn-primary btn-hero btn-hero-primary" onClick={onShop} type="button">
          Explore Collection <ArrowRight size={18} style={{ marginLeft: 8 }} />
        </button>

        <button className="btn btn-hero btn-hero-secondary" onClick={onShop} type="button">
          Shop Deals
        </button>
      </div>

      <div className="hero-proof">
        <div className="hero-proof-item">
          <strong>4.9★</strong>
          <span>satisfaction</span>
        </div>
        <div className="hero-proof-item">
          <strong>Express</strong>
          <span>shipping</span>
        </div>
        <div className="hero-proof-item">
          <strong>Elite</strong>
          <span>service</span>
        </div>
      </div>
    </div>
  );
});
HeroCopyRight.displayName = "HeroCopyRight";

export default function Hero() {
  const navigate = useNavigate();
  const { API_URL } = useAppContext();

  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  const API_BASE = useMemo(() => API_URL.replace(/\/api\/?$/i, ""), [API_URL]);

  const resolveImage = (path) => {
    if (!path) return DEFAULT_IMG;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    if (path.startsWith("/")) return `${API_BASE}${path}`;
    return `${API_BASE}/${path.replace(/^\/+/, "")}`;
  };

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const res = await axios.get(`${API_URL}/hero-products`);
        setSlides(res.data || []);
      } catch (err) {
        console.error("Error fetching hero products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHero();
  }, [API_URL]);

  // Preload
  useEffect(() => {
    if (!slides.length) return;
    slides.forEach((s) => {
      const imgUrl = resolveImage(s?.product?.image);
      if (!imgUrl) return;
      const img = new Image();
      img.src = imgUrl;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides]);

  // Auto rotate
  useEffect(() => {
    if (!slides.length || paused) return;

    const timer = setInterval(() => {
      setCurrentSlide((p) => (p + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length, paused]);

  const active = slides[currentSlide];
  if (loading || !slides.length || !active?.product) return null;

  const bg = resolveImage(active.product.image);

  const productTitle = active.product.name || active.title || "Featured";
  const productDesc = active.product.description || active.description || "";
  const productPrice = active.product.price != null ? `$${active.product.price}` : "";

  return (
    <section
      className="hero hero-v3"
      style={{ ["--hero-bg"]: `url("${bg}")` }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hero-inner hero-inner--1400">
        {/* LEFT: Copy stays left */}
        <div className="hero-left">
          <HeroCopyRight onShop={() => navigate("/shop")} />

          {/* Little product info + indicators (left) */}
          <div className="hero-feature-mini">
            <div className="hero-feature-line">
              <span className="hero-feature-title">{productTitle}</span>
              {productPrice ? <span className="hero-feature-price">{productPrice}</span> : null}
            </div>

            {productDesc ? <p className="hero-feature-desc">{productDesc}</p> : null}

            <div className="hero-dots hero-dots--left">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  className={`hero-dot ${idx === currentSlide ? "active" : ""}`}
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  type="button"
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: empty, background carries the visual */}
        <div className="hero-right" aria-hidden="true" />
      </div>
    </section>
  );
}
