import React, { useState, useEffect } from 'react';

const AdminBookManagement = ({ user }) => {
  const [bookData, setBookData] = useState({
    title: '',
    author: '',
    isbn: '',
    genre: '',
    publication_year: '',
    description: '',
    total_copies: 1,
    available_copies: 1,
    cover_image: null
  });
  const [message, setMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // All available genres from your models.py
  const ALL_GENRES = [
    // Academic Disciplines
    'Sciences',
    'Social Sciences',
    'Humanities',
    'Business & Economics',
    'Law & Legal Studies',
    'Technology & Computer Science',
    'Medical & Health Sciences',
    'Engineering',
    'Education',
    'Arts & Architecture',

    // Fiction Categories
    'Mystery/Thriller',
    'Fantasy',
    'Science Fiction',
    'Romance',
    'Tragic Play / Drama',
    'Epic / Mythology',
    'Existential Fiction',
    'Historical Fiction',
    'Gothic Fiction',
    'Literary Fiction',
    'Satire/Adventure',
    'Psychological Fiction',
    'Coming-of-Age',
    'Tragedy',
    'Horror',
    'Poetry',
    'Epic Poetry',

    'Graphic Novels/Manga',

    // General Categories
    'Biography/Autobiography',
    'History',
    'Philosophy',
    'Religion/Spirituality',
    'Self-Help',
    'Travel',
    'Cookbooks',
    'Other'
  ];

  // Get CSRF token from cookies
  const getCsrfToken = () => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
  };

  // Add this useEffect for validation
  useEffect(() => {
    if (parseInt(bookData.available_copies) > parseInt(bookData.total_copies)) {
      setBookData(prev => ({
        ...prev,
        available_copies: prev.total_copies
      }));
    }
  }, [bookData.total_copies, bookData.available_copies]);

  const handleAvailableCopiesChange = (e) => {
    const value = e.target.value;
    const total = parseInt(bookData.total_copies) || 0;

    if (value > total) {
      alert('Available copies cannot exceed total copies');
      setBookData(prev => ({
        ...prev,
        available_copies: total
      }));
    } else {
      setBookData(prev => ({
        ...prev,
        available_copies: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrorDetails('');
    setLoading(true);

    try {
      const formData = new FormData();

      // Append all fields to formData
      Object.keys(bookData).forEach(key => {
        if (bookData[key] !== null && bookData[key] !== '') {
          formData.append(key, bookData[key]);
        }
      });

      const csrfToken = getCsrfToken();

      const response = await fetch('http://localhost:8000/api/admin/books/add/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRFToken': csrfToken || '',
        },
        body: formData,
      });

      // Check content type to ensure it's JSON
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        const responseData = await response.json();

        if (response.ok) {
          setMessage(responseData.success || 'Book added successfully!');
          // Reset form
          setBookData({
            title: '',
            author: '',
            isbn: '',
            genre: '',
            publication_year: '',
            description: '',
            total_copies: 1,
            available_copies: 1,
            cover_image: null
          });
          setImagePreview(null);
        } else {
          setMessage(responseData.error || 'Failed to add book');
          setErrorDetails(responseData.details ? JSON.stringify(responseData.details) : '');
        }
      } else {
        // Handle non-JSON response (HTML error page)
        const textResponse = await response.text();
        setMessage('Server error: Received HTML response instead of JSON. Please check server logs.');
        console.error('Non-JSON response received:', textResponse.substring(0, 200));
      }
    } catch (error) {
      setMessage('Network error: ' + error.message);
      console.error('Network error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setBookData({
      ...bookData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBookData({
        ...bookData,
        cover_image: file
      });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearForm = () => {
    setBookData({
      title: '',
      author: '',
      isbn: '',
      genre: '',
      publication_year: '',
      description: '',
      total_copies: 1,
      available_copies: 1,
      cover_image: null
    });
    setImagePreview(null);
    setMessage('');
    setErrorDetails('');
  };

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h4>Add New Book</h4>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={clearForm}
          disabled={loading}
        >
          Clear Form
        </button>
      </div>
      <div className="card-body">
        {message && (
          <div className={`alert ${message.includes('successfully') ? 'alert-success' : 'alert-danger'}`}>
            {message}
            {errorDetails && (
              <div className="mt-2">
                <strong>Details:</strong>
                <pre className="mt-2 p-2 bg-light border rounded" style={{ fontSize: '0.8rem' }}>
                  {errorDetails}
                </pre>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-control"
                  name="title"
                  value={bookData.title}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Author *</label>
                <input
                  type="text"
                  className="form-control"
                  name="author"
                  value={bookData.author}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">ISBN *</label>
                <input
                  type="text"
                  className="form-control"
                  name="isbn"
                  value={bookData.isbn}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Cover Image</label>
                <input
                  type="file"
                  className="form-control"
                  name="cover_image"
                  onChange={handleImageChange}
                  accept="image/*"
                  disabled={loading}
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="img-thumbnail"
                      style={{ maxHeight: '150px' }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Genre *</label>
                <select
                  className="form-select"
                  name="genre"
                  value={bookData.genre}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Genre</option>
                  {ALL_GENRES.map(genre => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Publication Year</label>
                <input
                  type="number"
                  className="form-control"
                  name="publication_year"
                  value={bookData.publication_year}
                  onChange={handleChange}
                  min="1000"
                  max="2030"
                  disabled={loading}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Total Copies *</label>
                <input
                  type="number"
                  className="form-control"
                  name="total_copies"
                  value={bookData.total_copies}
                  onChange={handleChange}
                  min="1"
                  required
                  disabled={loading}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Available Copies *</label>
                <input
                  type="number"
                  className="form-control"
                  name="available_copies"
                  value={bookData.available_copies}
                  onChange={handleAvailableCopiesChange}
                  min="0"
                  max={bookData.total_copies}
                  required
                  disabled={loading}
                />
                <small className="form-text text-muted">
                  Available copies cannot exceed total copies
                </small>
              </div>
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              name="description"
              value={bookData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Enter a brief description of the book..."
              disabled={loading}
            ></textarea>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Adding Book...
              </>
            ) : (
              'Add Book'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminBookManagement;