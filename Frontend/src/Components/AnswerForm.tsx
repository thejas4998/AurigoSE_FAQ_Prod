// src/components/AnswerForm.tsx
import React, { useState } from 'react';

type AnswerFormProps = {
  onSubmit: (body: string) => void;
};

const AnswerForm: React.FC<AnswerFormProps> = ({ onSubmit }) => {
  const [body, setBody] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (body.trim()) {
      onSubmit(body);
      setBody('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Type your answer here..."
        rows={4}
        cols={50}
      />
      <br />
      <button type="submit">Submit Answer</button>
    </form>
  );
};

export default AnswerForm;