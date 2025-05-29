import React, { useState } from 'react';

function MessageInput({ onSendMessage }) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="border-t border-gray-300 p-4 bg-white shadow-lg" data-testid="message-input-container">
      <form onSubmit={handleSubmit} className="flex space-x-2" data-testid="message-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          data-testid="message-input"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white rounded-full px-5 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          data-testid="send-button"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default MessageInput;