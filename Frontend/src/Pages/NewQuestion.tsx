import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postQuestion } from '../Api/faqAPI';

const NewQuestion: React.FC = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('General');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await postQuestion({ title: title.trim(), body: body.trim(), category });
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Failed to submit question. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2>Ask a New Question</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="title">Title:</label><br />
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="body">Body:</label><br />
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={5}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="category">Category:</label><br />
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            style={{ width: '100%' }}
          >
            <option value="General">General</option>
            <option value="Integrations">Integrations</option>
            <option value="Build setup">Build setup</option>
          </select>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={submitting || !title.trim() || !body.trim()}>
          {submitting ? 'Submitting...' : 'Submit Question'}
        </button>
      </form>
    </div>
  );
};

export default NewQuestion;