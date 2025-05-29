import React, { forwardRef } from 'react';
import Message from './Message';

const MessageDisplay = forwardRef(({ messages }, ref) => {
  return (
    <div 
      ref={ref}
      className="flex-1 overflow-y-auto p-4 space-y-4"
      data-testid="message-display"
    >
      {messages && messages.length > 0 ? (
        messages.map(message => (
          <Message 
            key={message.id} 
            text={message.text} 
            sender={message.sender}
            timestamp={message.timestamp}
          />
        ))
      ) : (
        <div data-testid="no-messages">No messages yet</div>
      )}
    </div>
  );
});

// Add displayName for better debugging and testing
MessageDisplay.displayName = 'MessageDisplay';

export default MessageDisplay;