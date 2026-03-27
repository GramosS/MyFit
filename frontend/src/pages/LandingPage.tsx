import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../lib/auth";

export function LandingPage() {
  const navigate = useNavigate();
  const firstFeatureRef = useRef<HTMLElement | null>(null);
  const hasToken = Boolean(getToken());

  useEffect(() => {
    const revealEls = Array.from(document.querySelectorAll<HTMLElement>(".js-reveal"));
    if (revealEls.length === 0) return;

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
    );

    revealEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header className="top-nav">
        <a className="logo" href="/" onClick={(e) => (e.preventDefault(), navigate("/"))}>
          MyFit
        </a>
      </header>

      <main>
        <section className="hero">
          <div className="hero-overlay" />
          <div className="hero-content">
            <h1>
              <span>Din fitness.</span>
              <br />
              <span className="highlight">Ditt verktyg.</span>
            </h1>
            <p>
              Logga träning, spåra kalorier och följ din vikt – allt i en snygg app som körs direkt i
              din webbläsare.
            </p>
            <div className="hero-actions">
              <button className="cta-button primary" onClick={() => navigate(hasToken ? "/dashboard" : "/register")}>
                {hasToken ? "Till dashboard" : "Kom igång"}
              </button>
              <button
                className="cta-button secondary"
                onClick={() => firstFeatureRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                Utforska funktioner
              </button>
            </div>
            <div className="scroll-indicator" aria-hidden="true">
              <div className="mouse">
                <div className="wheel" />
              </div>
            </div>
          </div>
        </section>

        <section className="value-strip">
          <div className="value-item">
            <span className="value-number">100%</span>
            <span className="value-label">Gratis</span>
          </div>
          <div className="value-item">
            <span className="value-number">0</span>
            <span className="value-label">Inloggningar krävs</span>
          </div>
          <div className="value-item">
            <span className="value-number">∞</span>
            <span className="value-label">Lokal lagring</span>
          </div>
          <div className="value-item">
            <span className="value-number">24/7</span>
            <span className="value-label">Tillgänglig offline</span>
          </div>
        </section>

        <section
          className="feature-section"
          ref={(el) => {
            firstFeatureRef.current = el;
          }}
        >
          <header className="feature-header">
            <h2>
              Allt du behöver. <span className="highlight">Inget du inte behöver.</span>
            </h2>
            <p>
              Enkelt och kraftfullt – designad för dig som tränar och vill ha kontroll utan krångel.
            </p>
          </header>

          <div className="feature-grid js-reveal">
            <div className="feature-image-wrapper">
              <img
                src="/assets/feature-workout.jpg"
                alt="Person som tränar med skivstång på gym"
                className="feature-image"
              />
            </div>
            <article className="feature-card">
              <div className="feature-icon">🏋️</div>
              <h3>Träningslogg</h3>
              <p>
                Logga pass med övningar, vikter, set och reps. Följ din progression med tydlig historik
                och fokus på det som faktiskt spelar roll.
              </p>
            </article>
          </div>
        </section>

        <section className="feature-section feature-section--alt">
          <div className="feature-grid js-reveal">
            <article className="feature-card">
              <div className="feature-icon">🥗</div>
              <h3>Kostspårning</h3>
              <p>
                Logga måltider med kalorier och typ (frukost, lunch, middag, mellanmål). Följ ditt
                dagliga intag och få en tydlig översikt över dina matvanor.
              </p>
            </article>
            <div className="feature-image-wrapper">
              <img src="/assets/feature-nutrition.jpg" alt="Meal-prep med matlådor" className="feature-image" />
            </div>
          </div>
        </section>

        <section className="feature-section">
          <div className="feature-grid js-reveal">
            <div className="feature-image-wrapper">
              <img src="/assets/feature-lifestyle.jpg" alt="Person som står på en våg" className="feature-image" />
            </div>
            <article className="feature-card">
              <div className="feature-icon">⚖️</div>
              <h3>Livsstil &amp; Vikt</h3>
              <p>
                Logga kroppsvikt och följ din utveckling över tid. Se din vikt-historik och håll koll
                på trender, utan att det känns krångligt.
              </p>
            </article>
          </div>
        </section>
      </main>

      <footer className="page-footer">
        <p>Proof of Concept · Fitness Tracker · 2026</p>
      </footer>
    </>
  );
}

