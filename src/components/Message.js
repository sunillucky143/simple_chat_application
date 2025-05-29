import React from 'react';

function Message({ text, sender, timestamp }) {
  const isUser = sender === 'user';
  
  // Format timestamp with validation
  const formattedTime = timestamp instanceof Date 
    ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`} data-testid="message-container">
      <div 
        className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 ${
          isUser 
            ? 'bg-blue-500 text-white rounded-br-none' 
            : 'bg-gray-200 text-gray-800 rounded-bl-none'
        }`}
        data-testid="message-bubble"
        data-sender={sender}
      >
        <p className="mb-1" data-testid="message-text">{text}</p>
        <p className={`text-xs ${isUser ? 'text-blue-100' : 'text-gray-500'} text-right`} data-testid="message-timestamp">
          {formattedTime}
        </p>
      </div>
    </div>
  );
}

export default Message;