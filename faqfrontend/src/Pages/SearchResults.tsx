import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { searchQuestions } from '../Api/faqAPI';
import './SearchResults.css';

interface SearchResult {
  id: number;
  title: string;
  body: string | null;
  category: string;
  createdAt: string;
  answered: boolean;
  answers: any[];
  imageUrls: string[];
}

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newSearchQuery, setNewSearchQuery] = useState(query);

  useEffect(() => {
    if (query) {
      performSearch(query);
    } else {
      setIsLoading(false);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    setError('');

    try {
      const searchResults = await searchQuestions(searchQuery);
      setResults(searchResults);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Failed to search questions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSearchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(newSearchQuery.trim())}`);
    }
  };

  const highlightSearchTerm = (text: string, term: string) => {
    if (!term || !text) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? <mark key={index}>{part}</mark> : part
    );
  };

  const truncateText = (text: string | null, maxLength: number = 200) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="search-results-container">
      {/* Search Header */}
      <div className="search-header">
        <h1>Search Results</h1>
        <form onSubmit={handleNewSearch} className="search-form">
          <input
            type="text"
            value={newSearchQuery}
            onChange={(e) => setNewSearchQuery(e.target.value)}
            placeholder="Search for questions..."
            className="search-input"
          />
          <button type="submit" className="search-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
        </form>
      </div>

      {/* Results Summary */}
      {!isLoading && query && (
        <div className="results-summary">
          {results.length > 0 ? (
            <p>Found <strong>{results.length}</strong> results for "<strong>{query}</strong>"</p>
          ) : (
            <p>No results found for "<strong>{query}</strong>"</p>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Searching...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={() => performSearch(query)} className="retry-button">
            Try Again
          </button>
        </div>
      )}

      {/* Results List */}
      {!isLoading && !error && results.length > 0 && (
        <div className="results-list">
          {results.map((result) => (
            <Link 
              to={`/questions/${result.id}`} 
              key={result.id}
              className="result-card"
            >
              <div className="result-header">
                <h2>{highlightSearchTerm(result.title, query)}</h2>
                <span className={`status-badge ${result.answered ? 'answered' : 'unanswered'}`}>
                  {result.answered ? '✓ Answered' : '? Unanswered'}
                </span>
              </div>
              
              {result.body && (
                <p className="result-body">
                  {highlightSearchTerm(truncateText(result.body), query)}
                </p>
              )}
              
              <div className="result-meta">
                <span className="category-tag">{result.category}</span>
                <span className="answer-count">
                  {result.answers.length} {result.answers.length === 1 ? 'answer' : 'answers'}
                </span>
                <span className="date">
                  {new Date(result.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Show matching answers if any */}
              {result.answers.some(a => a.body.toLowerCase().includes(query.toLowerCase())) && (
                <div className="matching-answers">
                  <p className="matching-label">Matching answers:</p>
                  {result.answers
                    .filter(a => a.body.toLowerCase().includes(query.toLowerCase()))
                    .slice(0, 2)
                    .map((answer, index) => (
                      <p key={index} className="answer-preview">
                        {highlightSearchTerm(truncateText(answer.body, 150), query)}
                      </p>
                    ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* No Results State */}
      {!isLoading && !error && results.length === 0 && query && (
        <div className="no-results">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
            <path d="M8 11h6" strokeLinecap="round"></path>
          </svg>
          <h2>No results found</h2>
          <p>Try searching with different keywords or browse categories</p>
          <div className="no-results-actions">
            <Link to="/" className="action-link">Browse Categories</Link>
            <Link to="/" className="action-link primary">Ask a Question</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;