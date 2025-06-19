// src/components/QuestionList.tsx
import React from 'react';
import { Link } from 'react-router-dom';

type Question = {
  id: number;
  title: string;
  category: string;
};

type QuestionListProps = {
  questions: Question[];
};

const QuestionList: React.FC<QuestionListProps> = ({ questions }) => {
  return (
    <ul>
      {questions.map((q) => (
        <li key={q.id}>
          <Link to={`/questions/${q.id}`}>
            <strong>{q.title}</strong> <em>({q.category})</em>
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default QuestionList;