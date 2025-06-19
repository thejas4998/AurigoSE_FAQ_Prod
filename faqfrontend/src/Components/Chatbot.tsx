import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './Chatbot.css';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  relatedQuestions?: RelatedQuestion[];
}

interface RelatedQuestion {
  id: number;
  title: string;
  body: string | null;
  category: string;
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! What would you like to know?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Call the API
      const response = await axios.post('http://localhost:5267/api/questions/chatbot', {
        message: inputMessage
      });

      const botMessage: Message = {
        id: messages.length + 2,
        text: response.data.response,
        sender: 'bot',
        timestamp: new Date(),
        relatedQuestions: response.data.relatedQuestions
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error calling chatbot API:', error);
      
      // Fallback response on error
      const errorMessage: Message = {
        id: messages.length + 2,
        text: "I'm sorry, I'm having trouble connecting to the server. Please try again later or browse the FAQ categories directly.",
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuestionClick = (questionId: number) => {
    // Navigate to the question detail page
    window.location.href = `/questions/${questionId}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chat Button */}
      <button 
        className={`chatbot-button ${isOpen ? 'active' : ''}`}
        onClick={handleToggleChat}
        aria-label="Toggle chat"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">🤖</div>
              <div>
                <h3>FAQ Assistant</h3>
                <span className="chatbot-status">Online</span>
              </div>
            </div>
            <button 
              className="chatbot-close"
              onClick={handleToggleChat}
              aria-label="Close chat"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
              >
                <div className="message-content">
                  {message.text}
                  
                  {/* Show related questions if available */}
                  {message.relatedQuestions && message.relatedQuestions.length > 0 && (
                    <div className="related-questions">
                      <p className="related-questions-title">Related questions:</p>
                      {message.relatedQuestions.map((q) => (
                        <button
                          key={q.id}
                          className="related-question-link"
                          onClick={() => handleQuestionClick(q.id)}
                        >
                          {q.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="message-time">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="chatbot-input-form">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="chatbot-input"
              disabled={isTyping}
            />
            <button 
              type="submit" 
              className="chatbot-send"
              disabled={!inputMessage.trim() || isTyping}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;