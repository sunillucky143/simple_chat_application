import React from 'react';

function Message({ text, sender, timestamp }) {
  const isUser = sender === 'user';
  
  // Format timestamp
  const formattedTime = timestamp.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 ${
          isUser 
            ? 'bg-blue-500 text-white rounded-br-none' 
            : 'bg-gray-200 text-gray-800 rounded-bl-none'
        }`}
      >
        <p className="mb-1">{text}</p>
        <p className={`text-xs ${isUser ? 'text-blue-100' : 'text-gray-500'} text-right`}>
          {formattedTime}
        </p>
      </div>
    </div>
  );
}

export default Message;