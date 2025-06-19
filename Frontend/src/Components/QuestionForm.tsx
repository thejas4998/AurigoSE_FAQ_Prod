// src/components/QuestionForm.tsx
import React, { useState } from 'react';

type QuestionFormProps = {
  onSubmit: (data: {
    title: string;
    body: string;
    category: string;
    images: FileList | null;
  }) => void;
};

const [images, setImages] = useState<FileList | null>(null);
const QuestionForm: React.FC<QuestionFormProps> = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('General');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && body.trim()) {
      onSubmit({ title, body, category, images});
      setTitle('');
      setBody('');
      setCategory('General');
      setImages(null);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      /><br />

      <textarea
        placeholder="Question details"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      /><br />

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="General">General</option>
        <option value="Integrations">Integrations</option>
        <option value="Build setup">Build setup</option>
      </select><br />

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => setImages(e.target.files)}
      /><br />

      <button type="submit">Post Question</button>
    </form>
  );
};

export default QuestionForm;