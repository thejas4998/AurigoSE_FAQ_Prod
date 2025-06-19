// src/api/faqApi.ts
import axios from 'axios';

const API_BASE = 'http://localhost:5267/api';

// Question interface
export interface QuestionDto {
  id: number;
  title: string;
  body: string | null;
  category: string;
  createdAt: string;
  answered: boolean;
  answers: any[];
  imageUrls: string[];
}

export const getQuestions = async (category?: string) => {
  const url = category
    ? `${API_BASE}/questions?category=${encodeURIComponent(category)}`
    : `${API_BASE}/questions`;
    
  const response = await axios.get(url);
  return response.data;
};

export const getQuestion = async (id: number) => {
  const response = await axios.get(`${API_BASE}/questions/${id}`);
  return response.data;
};

// Modified to accept JSON data and return the created question
export const postQuestion = async (questionData: {
  title: string;
  body: string;
  category: string;
}): Promise<QuestionDto> => {
  const response = await axios.post(`${API_BASE}/questions`, questionData, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

// New function to upload images for a question
export const uploadQuestionImages = async (formData: FormData): Promise<string[]> => {
  const response = await axios.post(`${API_BASE}/imageupload/question`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// New function to upload images for an answer
export const uploadAnswerImages = async (formData: FormData): Promise<string[]> => {
  const response = await axios.post(`${API_BASE}/imageupload/answer`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const postAnswer = async (
  questionId: number,
  answer: { body: string }
) => {
  const response = await axios.post(`${API_BASE}/answers`, {
    questionId,
    body: answer.body,
  });
  return response.data;
};

export const getCategories = async (): Promise<string[]> => {
  const response = await axios.get(`${API_BASE}/questions/categories`);
  return response.data;
};

// Vote on an answer
export const voteOnAnswer = async (answerId: number, isUpvote: boolean): Promise<{ upvotes: number; downvotes: number }> => {
  const response = await axios.post(`${API_BASE}/votes/answer/${answerId}`, { isUpvote });
  return response.data;
};

// Get vote status for an answer
export const getAnswerVotes = async (answerId: number): Promise<{ upvotes: number; downvotes: number; userVote: string | null }> => {
  const response = await axios.get(`${API_BASE}/votes/answer/${answerId}`);
  return response.data;
};

// Search questions
export const searchQuestions = async (searchQuery: string): Promise<any[]> => {
  const response = await axios.get(`${API_BASE}/questions/search`, {
    params: { q: searchQuery }
  });
  return response.data;
};