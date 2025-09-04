import React from 'react';
import { Link } from 'react-router-dom';
import './VintageLandingPage.css';

const VintageLandingPage = () => {
  return (
    <div className="vintage-landing">
      {/* Hero Section with Vintage Appeal */}
      <section
        className="vintage-hero"
        style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative'
        }}
      >
        <div className="vintage-overlay"></div>

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
            {/* Add Our Team link below the buttons */}
            <div className="mt-3">
              <Link to="/team" style={{color: '#d4b483', textDecoration: 'underline'}}>
                Meet Our Team
              </Link>
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