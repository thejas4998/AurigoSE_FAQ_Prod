import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getQuestion, postAnswer, uploadAnswerImages, voteOnAnswer } from '../Api/faqAPI';
import './QuestionDetails.css';

type Answer = {
  id: number;
  body: string;
  createdAt: string;
  questionId: number;
  imageUrls: string[];
  upvoteCount: number;
  downvoteCount: number;
  userVote: string | null;
};

type Question = {
  id: number;
  title: string;
  body: string;
  category: string;
  createdAt: string;
  answered: boolean;
  answers: Answer[];
  imageUrls: string[];
};

const QuestionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answerBody, setAnswerBody] = useState('');
  const [answerImages, setAnswerImages] = useState<FileList | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [votingAnswerId, setVotingAnswerId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'votes'>('votes');
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [imageModal, setImageModal] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      getQuestion(parseInt(id)).then(setQuestion);
    }
  }, [id]);

  const handleVote = async (answerId: number, isUpvote: boolean) => {
    if (!question || votingAnswerId) return;
    
    setVotingAnswerId(answerId);
    
    try {
      const result = await voteOnAnswer(answerId, isUpvote);
      
      setQuestion({
        ...question,
        answers: question.answers.map(answer => {
          if (answer.id === answerId) {
            let newUserVote: string | null = null;
            if (answer.userVote === (isUpvote ? 'upvote' : 'downvote')) {
              newUserVote = null;
            } else {
              newUserVote = isUpvote ? 'upvote' : 'downvote';
            }
            
            return {
              ...answer,
              upvoteCount: result.upvotes,
              downvoteCount: result.downvotes,
              userVote: newUserVote
            };
          }
          return answer;
        })
      });
    } catch (error) {
      console.error('Failed to vote:', error);
      alert('Failed to register your vote. Please try again.');
    } finally {
      setVotingAnswerId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !answerBody.trim()) return;

    setIsSubmitting(true);
    setUploadProgress('Submitting answer...');

    try {
      const newAnswer = await postAnswer(question.id, { body: answerBody });
      
      let uploadedImageUrls: string[] = [];
      if (answerImages && answerImages.length > 0 && newAnswer.id) {
        setUploadProgress(`Uploading ${answerImages.length} image(s)...`);
        
        const formData = new FormData();
        formData.append('answerId', newAnswer.id.toString());
        
        Array.from(answerImages).forEach((file) => {
          formData.append('files', file);
        });
        
        uploadedImageUrls = await uploadAnswerImages(formData);
      }
      
      const answerWithImages = {
        ...newAnswer,
        imageUrls: uploadedImageUrls,
        upvoteCount: 0,
        downvoteCount: 0,
        userVote: null
      };
      
      setQuestion({
        ...question,
        answered: true,
        answers: [...(question.answers ?? []), answerWithImages],
      });
      
      setAnswerBody('');
      setAnswerImages(null);
      setShowAnswerForm(false);
      const fileInput = document.getElementById('answer-image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Failed to submit answer:', error);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const maxSize = 5 * 1024 * 1024;
      const oversizedFiles = Array.from(files).filter(file => file.size > maxSize);
      
      if (oversizedFiles.length > 0) {
        alert(`Some files are too large. Maximum size is 5MB.`);
        e.target.value = '';
        return;
      }
      
      setAnswerImages(files);
    }
  };

  const getImagePreviews = () => {
    if (!answerImages) return [];
    return Array.from(answerImages).map((file, index) => ({
      file,
      url: URL.createObjectURL(file),
      index
    }));
  };

  const removeImage = (indexToRemove: number) => {
    if (!answerImages) return;
    
    const newFileList = Array.from(answerImages).filter((_, index) => index !== indexToRemove);
    const dataTransfer = new DataTransfer();
    newFileList.forEach(file => dataTransfer.items.add(file));
    
    const fileInput = document.getElementById('answer-image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.files = dataTransfer.files;
      setAnswerImages(dataTransfer.files);
    }
  };

  const sortedAnswers = React.useMemo(() => {
    if (!question) return [];
    
    return [...question.answers].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'votes':
          const scoreA = a.upvoteCount - a.downvoteCount;
          const scoreB = b.upvoteCount - b.downvoteCount;
          return scoreB - scoreA;
        default:
          return 0;
      }
    });
  }, [question, sortBy]);

  if (!question) {
    return (
      <div className="question-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading question...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="question-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span className="separator">/</span>
        <Link to={`/categories/${encodeURIComponent(question.category)}`}>
          {question.category}
        </Link>
        <span className="separator">/</span>
        <span className="current">Question</span>
      </div>

      {/* Question Section */}
      <div className="question-box">
        <div className="question-header-detail">
          <h1>{question.title}</h1>
          <div className="question-actions">
            <button 
              onClick={() => navigate(-1)} 
              className="back-button"
              title="Go back"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
          </div>
        </div>

        <p className="question-body">{question.body}</p>
        
        {/* Question Images */}
        {question.imageUrls && question.imageUrls.length > 0 && (
          <div className="question-images">
            {question.imageUrls.map((url, index) => (
              <img 
                key={index} 
                src={`http://localhost:5267${url}`} 
                alt={`Question image ${index + 1}`}
                className="question-image"
                onClick={() => setImageModal(`http://localhost:5267${url}`)}
              />
            ))}
          </div>
        )}
        
        <div className="question-metadata">
          <span className="category-tag">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            {question.category}
          </span>
          <span className="date-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Asked on {new Date(question.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
      </div>

      {/* Answers Section */}
      <div className="answers-section">
        <div className="answers-header">
          <h2>{question.answers?.length || 0} {question.answers?.length === 1 ? 'Answer' : 'Answers'}</h2>
          <div className="answers-controls">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="sort-select"
            >
              <option value="votes">Best Score</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
            {!showAnswerForm && (
              <button 
                onClick={() => setShowAnswerForm(true)}
                className="add-answer-btn"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Answer
              </button>
            )}
          </div>
        </div>

        {/* Answers List */}
        <div className="answers-list">
          {sortedAnswers.length === 0 ? (
            <div className="no-answers">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11H15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"/>
              </svg>
              <h3>No answers yet</h3>
              <p>Be the first to answer this question!</p>
              {!showAnswerForm && (
                <button 
                  onClick={() => setShowAnswerForm(true)}
                  className="be-first-btn"
                >
                  Write the First Answer
                </button>
              )}
            </div>
          ) : (
            sortedAnswers.map((answer) => (
              <div key={answer.id} className="answer-card">
                <div className="answer-content">
                  <p className="answer-body">{answer.body}</p>
                  
                  {/* Answer Images */}
                  {answer.imageUrls && answer.imageUrls.length > 0 && (
                    <div className="answer-images">
                      {answer.imageUrls.map((url, index) => (
                        <img 
                          key={index} 
                          src={`http://localhost:5267${url}`} 
                          alt={`Answer image ${index + 1}`}
                          className="answer-image"
                          onClick={() => setImageModal(`http://localhost:5267${url}`)}
                        />
                      ))}
                    </div>
                  )}
                  
                  <p className="answer-date">
                    Answered on {new Date(answer.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                
                {/* Voting Section */}
                <div className="voting-section">
                  <button
                    className={`vote-btn upvote ${answer.userVote === 'upvote' ? 'active' : ''}`}
                    onClick={() => handleVote(answer.id, true)}
                    disabled={votingAnswerId === answer.id}
                    title="Upvote this answer"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                    <span className="vote-count">{answer.upvoteCount}</span>
                  </button>
                  
                  <div className="vote-score">
                    <strong>{answer.upvoteCount - answer.downvoteCount}</strong>
                  </div>
                  
                  <button
                    className={`vote-btn downvote ${answer.userVote === 'downvote' ? 'active' : ''}`}
                    onClick={() => handleVote(answer.id, false)}
                    disabled={votingAnswerId === answer.id}
                    title="Downvote this answer"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                    <span className="vote-count">{answer.downvoteCount}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Answer Form */}
        {showAnswerForm && (
          <form onSubmit={handleSubmit} className="answer-form">
            <div className="form-header">
              <h3>Your Answer</h3>
              <button 
                type="button"
                onClick={() => setShowAnswerForm(false)}
                className="close-form"
              >
                ×
              </button>
            </div>
            
            <textarea
              value={answerBody}
              onChange={(e) => setAnswerBody(e.target.value)}
              placeholder="Write your answer here... Be specific and helpful!"
              required
              disabled={isSubmitting}
              rows={6}
            />
            
            <div className="image-upload-section">
              <label htmlFor="answer-image-upload" className="image-upload-label">
                📷 Attach Images (Optional)
              </label>
              <input
                id="answer-image-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                disabled={isSubmitting}
                className="image-upload-input"
              />
              
              {answerImages && answerImages.length > 0 && (
                <>
                  <div className="selected-images-info">
                    {answerImages.length} image(s) selected
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
            
            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => setShowAnswerForm(false)}
                className="cancel-btn"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="submit-btn">
                {isSubmitting ? uploadProgress : 'Post Answer'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Image Modal */}
      {imageModal && (
        <div className="image-modal" onClick={() => setImageModal(null)}>
          <img src={imageModal} alt="Enlarged view" />
          <button className="close-modal" onClick={() => setImageModal(null)}>
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionDetail;