import React, { forwardRef } from 'react';
import Message from './Message';

const MessageDisplay = forwardRef(({ messages }, ref) => {
  return (
    <div 
      ref={ref}
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {messages.map(message => (
        <Message 
          key={message.id} 
          text={message.text} 
          sender={message.sender}
          timestamp={message.timestamp}
        />
      ))}
    </div>
  );
});

export default MessageDisplay;