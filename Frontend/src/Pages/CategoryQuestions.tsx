import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getQuestions } from '../Api/faqAPI';
import './CategoryQuestions.css';

interface Question {
  id: number;
  title: string;
  body: string | null;
  category: string;
  createdAt: string;
  answered: boolean;
  answers: any[];
  imageUrls: string[];
}

const CategoryQuestions: React.FC = () => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'mostAnswers' | 'unanswered'>('newest');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (categoryName) {
      loadQuestions();
    }
  }, [categoryName]);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const data = await getQuestions(decodeURIComponent(categoryName!));
      setQuestions(data);
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskQuestion = () => {
    navigate('/', { state: { category: categoryName } });
  };

  // Filter and sort questions
  const filteredAndSortedQuestions = React.useMemo(() => {
    let filtered = questions;

    // Apply search filter
    if (searchTerm) {
      filtered = questions.filter(q => 
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.body && q.body.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'mostAnswers':
          return (b.answers?.length || 0) - (a.answers?.length || 0);
        case 'unanswered':
          if (!a.answered && b.answered) return -1;
          if (a.answered && !b.answered) return 1;
          return 0;
        default:
          return 0;
      }
    });

    return sorted;
  }, [questions, sortBy, searchTerm]);

  const stats = React.useMemo(() => ({
    total: questions.length,
    answered: questions.filter(q => q.answered).length,
    unanswered: questions.filter(q => !q.answered).length,
    totalAnswers: questions.reduce((sum, q) => sum + (q.answers?.length || 0), 0)
  }), [questions]);

  if (isLoading) {
    return (
      <div className="category-questions-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="category-questions-container">
      {/* Header Section */}
      <div className="category-header">
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <span className="separator">/</span>
          <span>Categories</span>
          <span className="separator">/</span>
          <span className="current">{decodeURIComponent(categoryName || '')}</span>
        </div>
        
        <div className="category-title-section">
          <h1 className="category-title">{decodeURIComponent(categoryName || '')}</h1>
          <button onClick={handleAskQuestion} className="ask-question-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Ask a Question
          </button>
        </div>

        {/* Stats Bar */}
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Questions</span>
          </div>
          <div className="stat">
            <span className="stat-value answered">{stats.answered}</span>
            <span className="stat-label">Answered</span>
          </div>
          <div className="stat">
            <span className="stat-value unanswered">{stats.unanswered}</span>
            <span className="stat-label">Unanswered</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.totalAnswers}</span>
            <span className="stat-label">Total Answers</span>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="controls-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search within this category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="clear-search">
              ×
            </button>
          )}
        </div>

        <div className="sort-controls">
          <label>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="sort-select"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="mostAnswers">Most Answers</option>
            <option value="unanswered">Unanswered First</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      {filteredAndSortedQuestions.length === 0 ? (
        <div className="no-questions">
          {searchTerm ? (
            <>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
                <path d="M8 11h6" strokeLinecap="round"></path>
              </svg>
              <h3>No questions found</h3>
              <p>Try adjusting your search terms</p>
            </>
          ) : (
            <>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h3>No questions yet</h3>
              <p>Be the first to ask a question in this category!</p>
              <button onClick={handleAskQuestion} className="ask-first-btn">
                Ask the First Question
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="question-list">
          {filteredAndSortedQuestions.map((question) => (
            <Link 
              to={`/questions/${question.id}`} 
              key={question.id} 
              className="question-card"
            >
              <div className="question-header">
                <h3>{question.title}</h3>
                <span className={`status-badge ${question.answered ? 'answered' : 'unanswered'}`}>
                  {question.answered ? '✓ Answered' : '? Unanswered'}
                </span>
              </div>
              
              {question.body && (
                <p className="question-preview">
                  {question.body.length > 150 
                    ? `${question.body.substring(0, 150)}...` 
                    : question.body}
                </p>
              )}
              
              <div className="question-meta">
                <div className="meta-left">
                  <span className="answer-count">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    {question.answers?.length || 0} answers
                  </span>
                  {question.imageUrls && question.imageUrls.length > 0 && (
                    <span className="has-images">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                      {question.imageUrls.length} images
                    </span>
                  )}
                </div>
                <span className="question-date">
                  {new Date(question.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Results summary */}
      {searchTerm && filteredAndSortedQuestions.length > 0 && (
        <div className="results-summary">
          Showing {filteredAndSortedQuestions.length} of {questions.length} questions
        </div>
      )}
    </div>
  );
};

export default CategoryQuestions;