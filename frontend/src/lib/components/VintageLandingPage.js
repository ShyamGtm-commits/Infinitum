// src/components/VintageLandingPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import './VintageLandingPage.css';

const VintageLandingPage = () => {
  return (
    <div className="vintage-landing">
      {/* Hero Section with Vintage Appeal */}
      <section className="vintage-hero">
        <div className="vintage-overlay">
          <div className="container">
            <div className="hero-content">
              <div className="vintage-border">
                <h1 className="vintage-title">Infinitum Library</h1>
                <p className="vintage-subtitle">Where Timeless Knowledge Meets Modern Access</p>
                <div className="ornamental-divider">
                  <span className="flourish">❦</span>
                </div>
                <p className="vintage-tagline">
                  Step into a world of literary elegance and digital convenience
                </p>
                <Link to="/register" className="vintage-cta-btn">Begin Your Journey</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features with Vintage Styling */}
      <section className="vintage-features">
        <div className="container">
          <div className="section-header">
            <h2>A Library Reimagined</h2>
            <div className="ornamental-divider">
              <span className="flourish">✻</span>
            </div>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-book-open"></i>
              </div>
              <h3>Curated Collections</h3>
              <p>Discover carefully selected titles across genres, from classic literature to modern works</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-feather-alt"></i>
              </div>
              <h3>Elegant Experience</h3>
              <p>Enjoy a browsing experience that honors the tradition of reading with modern convenience</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-clock"></i>
              </div>
              <h3>Timeless Access</h3>
              <p>Your personal library available anytime, anywhere with our digital platform</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials with Vintage Appeal */}
      <section className="vintage-testimonials">
        <div className="container">
          <div className="section-header">
            <h2>Words From Our Readers</h2>
            <div className="ornamental-divider">
              <span className="flourish">❧</span>
            </div>
          </div>
          
          <div className="testimonial-cards">
            <div className="testimonial-card">
              <div className="testimonial-content">
                <div className="quote-mark">"</div>
                <p>Infinitum has rekindled my love for reading. The elegant interface makes browsing a pleasure.</p>
                <div className="testimonial-author">
                  <h4>Eleanor W.</h4>
                  <p>Literature Professor</p>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-content">
                <div className="quote-mark">"</div>
                <p>I've discovered more books in one month with Infinitum than in years of visiting physical libraries.</p>
                <div className="testimonial-author">
                  <h4>James T.</h4>
                  <p>History Enthusiast</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="vintage-cta">
        <div className="container">
          <div className="cta-content">
            <h2>Begin Your Literary Journey</h2>
            <p>Join a community of readers who appreciate the art of reading</p>
            <div className="cta-buttons">
              <Link to="/register" className="cta-primary">Create Account</Link>
              <Link to="/login" className="cta-secondary">Sign In</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Vintage Footer */}
      <footer className="vintage-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <h3>Infinitum Library</h3>
              <p>Established 2025</p>
            </div>
            <div className="footer-info">
              <p>&copy; 2025 Infinitum Library. All rights reserved.</p>
              <p>Preserving the past, embracing the future</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VintageLandingPage;