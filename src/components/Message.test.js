import { render, screen } from '@testing-library/react';
import Message from './Message';

test('renders user message with correct styling', () => {
  const testMessage = {
    text: 'Hello there',
    sender: 'user',
    timestamp: new Date('2023-01-01T12:00:00')
  };
  
  render(
    <Message 
      text={testMessage.text} 
      sender={testMessage.sender} 
      timestamp={testMessage.timestamp} 
    />
  );
  
  const messageElement = screen.getByText('Hello there');
  expect(messageElement).toBeInTheDocument();
  
  // Check that the message has the user styling (blue background)
  const messageContainer = messageElement.closest('div');
  expect(messageContainer).toHaveClass('bg-blue-500');
});

test('renders bot message with correct styling', () => {
  const testMessage = {
    text: 'I am a bot',
    sender: 'bot',
    timestamp: new Date('2023-01-01T12:00:00')
  };
  
  render(
    <Message 
      text={testMessage.text} 
      sender={testMessage.sender} 
      timestamp={testMessage.timestamp} 
    />
  );
  
  const messageElement = screen.getByText('I am a bot');
  expect(messageElement).toBeInTheDocument();
  
  // Check that the message has the bot styling (gray background)
  const messageContainer = messageElement.closest('div');
  expect(messageContainer).toHaveClass('bg-gray-200');
});

test('displays formatted timestamp', () => {
  const testMessage = {
    text: 'Test message',
    sender: 'user',
    timestamp: new Date('2023-01-01T12:30:00')
  };
  
  render(
    <Message 
      text={testMessage.text} 
      sender={testMessage.sender} 
      timestamp={testMessage.timestamp} 
    />
  );
  
  // Format should match the one in the component
  const formattedTime = testMessage.timestamp.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const timeElement = screen.getByText(formattedTime);
  expect(timeElement).toBeInTheDocument();
});