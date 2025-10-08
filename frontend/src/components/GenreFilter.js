import React from 'react';

const GenreFilter = ({ genres, selectedGenre, onGenreSelect, onClearGenre }) => {
    // Group genres by category
    const genreCategories = {
        'Academic Disciplines': [
            'Sciences', 'Social Sciences', 'Humanities', 'Business & Economics',
            'Law & Legal Studies', 'Technology & Computer Science',
            'Medical & Health Sciences', 'Engineering', 'Education', 'Arts & Architecture'
        ],
        'Fiction': [
            'Mystery/Thriller', 'Fantasy', 'Science Fiction', 'Romance', 'Tragic Play / Drama','Epic / Mythology', 'Existential Fiction',
            'Historical Fiction','Gothic Fiction', 'Literary Fiction', 'Graphic Novels/Manga',
            'Satire/Adventure','Psychological Fiction','Coming-of-Age','Tragedy','Horror','Poetry','Epic Poetry'
        ],
        'General': [
            'Biography/Autobiography', 'History', 'Philosophy',
            'Religion/Spirituality', 'Self-Help', 'Travel', 'Cookbooks', 'Other'
        ]
    };

    return (
        <div className="card mb-3">
            <div className="card-header">
                <h6 className="mb-0">Filter by Genre</h6>
            </div>
            <div className="card-body">
                <div className="genre-categories">
                    <button
                        className={`btn btn-sm ${selectedGenre === '' ? 'btn-primary' : 'btn-outline-primary'} mb-2`}
                        onClick={() => onGenreSelect('')}
                    >
                        All Genres
                    </button>

                    {Object.entries(genreCategories).map(([category, categoryGenres]) => (
                        <div key={category} className="genre-category mb-3">
                            <h6 className="category-title">{category}</h6>
                            <div className="d-flex flex-wrap gap-2">
                                {categoryGenres
                                    .filter(genre => genres.includes(genre))
                                    .map(genre => (
                                        <button
                                            key={genre}
                                            className={`btn btn-sm ${selectedGenre === genre ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => onGenreSelect(genre)}
                                        >
                                            {genre}
                                        </button>
                                    ))
                                }
                            </div>
                        </div>
                    ))}
                </div>
                {selectedGenre && (
                    <div className="mt-2">
                        <small>
                            Selected: <strong>{selectedGenre}</strong>
                            <button
                                className="btn btn-link btn-sm p-0 ms-2"
                                onClick={onClearGenre}
                            >
                                (clear)
                            </button>
                        </small>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GenreFilter;