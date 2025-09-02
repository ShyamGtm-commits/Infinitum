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

    try {
      const formData = new FormData();

      // Append all fields to formData
      Object.keys(bookData).forEach(key => {
        if (bookData[key] !== null && bookData[key] !== '') {
          formData.append(key, bookData[key]);
        }
      });

      const response = await fetch('http://localhost:8000/api/admin/books/add/', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

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
    } catch (error) {
      setMessage('Error adding book: ' + error.message);
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

  return (
    <div className="card">
      <div className="card-header">
        <h4>Add New Book</h4>
      </div>
      <div className="card-body">
        {message && (
          <div className={`alert ${message.includes('Error') ? 'alert-danger' : 'alert-success'}`}>
            {message}
          </div>
        )}

        {errorDetails && (
          <div className="alert alert-warning">
            <strong>Details:</strong> {errorDetails}
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
                >
                  <option value="">Select Genre</option>
                  <option value="Sciences">Sciences</option>
                  <option value="Social Sciences">Social Sciences</option>
                  <option value="Humanities">Humanities</option>
                  <option value="Technology & Computer Science">Technology & Computer Science</option>
                  <option value="Fantasy">Fantasy</option>
                  <option value="Mystery/Thriller">Mystery/Thriller</option>
                  <option value="Biography/Autobiography">Biography/Autobiography</option>
                  <option value="History">History</option>
                  <option value="Philosophy">Philosophy</option>
                  <option value="Other">Other</option>
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
            ></textarea>
          </div>
          <button type="submit" className="btn btn-primary">Add Book</button>
        </form>
      </div>
    </div>
  );
};

export default AdminBookManagement;