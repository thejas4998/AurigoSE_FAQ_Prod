import React, { useEffect, useState } from 'react';
import { getCategories, postQuestion, uploadQuestionImages, getQuestions } from '../Api/faqAPI';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../Api/authAPI';
import Chatbot from '../Components/Chatbot';
import './Home.css';

interface RecentQuestion {
  id: number;
  title: string;
  category: string;
  createdAt: string;
  answered: boolean;
  answerCount: number;
}

const Home: React.FC = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [images, setImages] = useState<FileList | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [recentQuestions, setRecentQuestions] = useState<RecentQuestion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  useEffect(() => {
    // Load categories
    getCategories().then((data) => {
      setCategories(data);
      if (data.length > 0) setSelectedCategory(data[0]);
    });

    // Load recent questions
    loadRecentQuestions();
  }, []);

  const loadRecentQuestions = async () => {
    try {
      const questions = await getQuestions();
      const recent = questions.slice(0, 5).map((q: any) => ({
        id: q.id,
        title: q.title,
        category: q.category,
        createdAt: q.createdAt,
        answered: q.answered,
        answerCount: q.answers?.length || 0
      }));
      setRecentQuestions(recent);
    } catch (error) {
      console.error('Failed to load recent questions:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const finalCategory = newCategory.trim() || selectedCategory;
    if (!title || !body || !finalCategory) return;

    setIsSubmitting(true);
    setUploadProgress('Submitting question...');
  
    try {
      const questionData = {
        title,
        body,
        category: finalCategory
      };
      
      const createdQuestion = await postQuestion(questionData);
      
      if (images && images.length > 0 && createdQuestion.id) {
        setUploadProgress(`Uploading ${images.length} image(s)...`);
        
        const formData = new FormData();
        formData.append('questionId', createdQuestion.id.toString());
        
        Array.from(images).forEach((file) => {
          formData.append('files', file);
        });
        
        await uploadQuestionImages(formData);
      }
      
      // Reset form
      setTitle('');
      setBody('');
      setNewCategory('');
      setImages(null);
      setUploadProgress('');
      setShowQuestionForm(false);
      
      // Reload recent questions
      loadRecentQuestions();
      
      navigate(`/questions/${createdQuestion.id}`);
    } catch (err) {
      alert('Failed to submit question');
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  const handleNewCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewCategory(value);
    if (value.trim()) {
      setSelectedCategory('');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const oversizedFiles = Array.from(files).filter(file => file.size > maxSize);
      
      if (oversizedFiles.length > 0) {
        alert(`Some files are too large. Maximum size is 5MB.`);
        e.target.value = '';
        return;
      }
      
      setImages(files);
    }
  };

  const getImagePreviews = () => {
    if (!images) return [];
    return Array.from(images).map((file, index) => ({
      file,
      url: URL.createObjectURL(file),
      index
    }));
  };

  const removeImage = (indexToRemove: number) => {
    if (!images) return;
    
    const newFileList = Array.from(images).filter((_, index) => index !== indexToRemove);
    const dataTransfer = new DataTransfer();
    newFileList.forEach(file => dataTransfer.items.add(file));
    
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.files = dataTransfer.files;
      setImages(dataTransfer.files);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'technical': '🔧',
      'general': '📋',
      'billing': '💳',
      'support': '🎧',
      'feature': '✨',
      'bug': '🐛',
      'documentation': '📚',
      'integration': '🔌'
    };
    
    const lowerCategory = category.toLowerCase();
    for (const [key, icon] of Object.entries(icons)) {
      if (lowerCategory.includes(key)) return icon;
    }
    return '📁';
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to FAQ Portal</h1>
          <p className="hero-subtitle">
            {currentUser ? `Hello ${currentUser.name || currentUser.email}! ` : ''}
            Find answers to your questions or ask something new
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Quick Actions */}
          <div className="quick-actions">
            <button 
              onClick={() => setShowQuestionForm(!showQuestionForm)}
              className="action-button primary"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Ask a Question
            </button>
          </div>
        </div>
      </section>

      {/* Question Form (Collapsible) */}
      {showQuestionForm && (
        <section className="ask-section expanded">
          <div className="section-header">
            <h2>Ask a Question</h2>
            <button 
              onClick={() => setShowQuestionForm(false)}
              className="close-button"
              aria-label="Close form"
            >
              ×
            </button>
          </div>
          <form onSubmit={handleSubmit} className="ask-form">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Question Title"
              required
              disabled={isSubmitting}
            />
            
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe your question in detail..."
              required
              disabled={isSubmitting}
              rows={4}
            />
            
            <div className="form-row">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={!!newCategory.trim() || isSubmitting}
                required={!newCategory.trim()}
              >
                <option value="" disabled>Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <input
                type="text"
                value={newCategory}
                onChange={handleNewCategoryChange}
                placeholder="Or create new category"
                disabled={isSubmitting}
              />
            </div>

            <div className="image-upload-section">
              <label htmlFor="image-upload" className="image-upload-label">
                📷 Attach Images (Optional)
              </label>
              <input
                id="image-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                disabled={isSubmitting}
                className="image-upload-input"
              />
              {images && images.length > 0 && (
                <>
                  <div className="selected-images-info">
                    {images.length} image(s) selected
                  </div>
                  <div className="image-preview-container">
                    {getImagePreviews().map(({ url, index }) => (
                      <div key={index} className="image-preview-item">
                        <img 
                          src={url} 
                          alt={`Preview ${index + 1}`} 
                          className="image-preview"
                          onLoad={() => URL.revokeObjectURL(url)}
                        />
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => removeImage(index)}
                          disabled={isSubmitting}
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="submit-button">
              {isSubmitting ? uploadProgress : 'Submit Question'}
            </button>
          </form>
        </section>
      )}

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Categories Section */}
        <section className="categories-section">
          <h2>Browse by Category</h2>
          <div className="category-grid">
            {categories.slice(0, 8).map((cat) => (
              <Link
                to={`/categories/${encodeURIComponent(cat)}`}
                key={cat}
                className="category-card"
              >
                <span className="category-icon">{getCategoryIcon(cat)}</span>
                <span className="category-name">{cat}</span>
                <svg className="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </Link>
            ))}
            {categories.length > 8 && (
              <Link to="/categories" className="category-card view-all">
                <span className="category-name">View All Categories</span>
                <svg className="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </Link>
            )}
          </div>
        </section>

        {/* Recent Questions Section */}
        <section className="recent-questions-section">
          <h2>Recent Questions</h2>
          <div className="recent-questions-list">
            {recentQuestions.map((question) => (
              <Link 
                to={`/questions/${question.id}`} 
                key={question.id}
                className="recent-question-card"
              >
                <div className="question-header">
                  <h3>{question.title}</h3>
                  <span className={`status-badge ${question.answered ? 'answered' : 'unanswered'}`}>
                    {question.answered ? '✓ Answered' : '? Unanswered'}
                  </span>
                </div>
                <div className="question-meta">
                  <span className="category-tag">{question.category}</span>
                  <span className="answer-count">{question.answerCount} answers</span>
                  <span className="date">{new Date(question.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
            {recentQuestions.length === 0 && (
              <p className="no-questions">No questions yet. Be the first to ask!</p>
            )}
          </div>
        </section>
      </div>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stat-card">
          <h3>{categories.length}</h3>
          <p>Categories</p>
        </div>
        <div className="stat-card">
          <h3>{recentQuestions.filter(q => q.answered).length}</h3>
          <p>Answered Questions</p>
        </div>
        <div className="stat-card">
          <h3>{recentQuestions.filter(q => !q.answered).length}</h3>
          <p>Pending Questions</p>
        </div>
      </section>
      
      {/* Chatbot Component */}
      <Chatbot />
    </div>
  );
};

export default Home;