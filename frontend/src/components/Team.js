import React from 'react';

const Team = () => {
  // Static team members data
  const teamMembers = [
    {
      id: 1,
      name: 'Shyam Sharan Gautam',
      role: 'Lead Developer',
      bio: "Shyam is the lead developer of Infinitum – A Digital Library, responsible for designing and implementing the system's core architecture using React, Django, and SQL. With a focus on functionality and user experience, he has overseen the development of key modules including book management, fine calculation, and user services.",
      image: process.env.PUBLIC_URL + '/images/shyam.jpg',
      social: {
        facebook: 'https://www.facebook.com/shyam.gautam.777701',
        github: 'https://github.com/ShyamGtm-commits',
        instagram: 'https://www.instagram.com/shyam__oy/?hl=en'
      }
    },
    {
      id: 2,
      name: 'Ashish Kumar Chaudhary',
      role: 'Content Curator',
      bio: 'Ashish is a passionate content creator specializing in library sciences and education, dedicated to producing engaging and informative content across multiple platforms. With a focus on creativity and audience connection, he strives to inspire and educate through high-quality content.',
      image: process.env.PUBLIC_URL + '/images/ashish.webp',
      social: {
        facebook: 'https://www.facebook.com/ashish.chaudhary.664857',
        instagram: 'https://www.instagram.com/aashishchaudhary14/?hl=en',
        github: 'https://github.com/Ashish880-dotcom'
      }
    },
    {
      id: 3,
      name: 'Koshish Buddha Thapa',
      role: 'User Experience Designer',
      bio: 'Koshish is a front-end developer specializing in building responsive and user-friendly web applications using technologies like React, HTML, CSS, and JavaScript. With a focus on creating seamless user experiences, he brings design concepts to life while ensuring performance and accessibility across devices.',
      image: process.env.PUBLIC_URL + '/images/koshish.jpeg',
      social: {
        facebook: 'https://www.facebook.com/koshish.thapa.792',
        instagram: 'https://www.instagram.com/koshishbuddhathapa/',
        github: 'https://github.com/koshishthapa517-crypto'
      }
    }
  ];

  // Fallback group photo
  const groupPhoto = process.env.PUBLIC_URL + '/images/team-group-photo.jpeg';

  return (
    <div className="team-page">
      {/* Hero Section */}
      <section
        className="hero-section"
        style={{
          backgroundImage: `url(${groupPhoto})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}
        ></div>

        <div className="container position-relative text-center text-white py-5">
          <h1 className="display-4 fw-bold">Meet Our Team</h1>
          <p className="lead">The passionate individuals behind Infinitum Library</p>
        </div>
      </section>

      <div className="container mt-5">
        <h2 className="text-center section-title mb-4">Our Team</h2>
        <p className="text-center mb-5">Our team consists of skilled professionals who are passionate about literature and technology.</p>

        <div className="row justify-content-center">
          {teamMembers.map(member => (
            <div key={member.id} className="col-md-4 mb-4">
              <div className="card team-member h-100 shadow-lg border-0">
                <div className="member-img" style={{ height: '300px', overflow: 'hidden' }}>
                  <img
                    src={member.image}
                    alt={member.name}
                    className="card-img-top"
                    style={{
                      height: '100%',
                      objectFit: 'cover',
                      width: '100%'
                    }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x300/4a6fa5/ffffff?text=' + encodeURIComponent(member.name.split(' ')[0]);
                    }}
                  />
                </div>
                <div className="card-body text-center">
                  <h4 className="card-title member-name">{member.name}</h4>
                  <h6 className="card-subtitle member-role text-muted mb-2">{member.role}</h6>
                  <p className="card-text">{member.bio}</p>
                  <div className="social-links d-flex justify-content-center gap-2">
                    {member.social.facebook && (
                      <a href={member.social.facebook} target="_blank" rel="noopener noreferrer" className="btn btn-sm text-white" style={{ backgroundColor: '#1877F2' }}>
                        <i className="fab fa-facebook-f"></i>
                      </a>
                    )}
                    {member.social.instagram && (
                      <a href={member.social.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-sm text-white" style={{ backgroundColor: '#E4405F' }}>
                        <i className="fab fa-instagram"></i>
                      </a>
                    )}
                    {member.social.github && (
                      <a href={member.social.github} target="_blank" rel="noopener noreferrer" className="btn btn-sm text-white" style={{ backgroundColor: '#333' }}>
                        <i className="fab fa-github"></i>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Information */}
        <div className="card mt-5 contact-info bg-dark text-white">
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <h3>Contact Us</h3>
                <p>Have questions or want to learn more about Infinitum? Reach out to us!</p>

                <div className="mt-4">
                  <p><i className="fas fa-map-marker-alt me-2"></i> 123 Library Street, Kathmandu, Nepal</p>
                  <p><i className="fas fa-phone me-2"></i> Phone: +977 123456789</p>
                  <p><i className="fas fa-envelope me-2"></i> Email: info@infinitumlibrary.com</p>
                </div>
              </div>
              <div className="col-md-6">
                <h3>Follow Us</h3>
                <p>Stay updated with the latest from Infinitum Library</p>

                <div className="d-flex gap-2 flex-wrap">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="btn text-white" style={{ backgroundColor: '#1877F2' }}>
                    <i className="fab fa-facebook-f"></i>
                  </a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="btn text-white" style={{ backgroundColor: '#1DA1F2' }}>
                    <i className="fab fa-twitter"></i>
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="btn text-white" style={{ backgroundColor: '#E4405F' }}>
                    <i className="fab fa-instagram"></i>
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="btn text-white" style={{ backgroundColor: '#0A66C2' }}>
                    <i className="fab fa-linkedin-in"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Team;
