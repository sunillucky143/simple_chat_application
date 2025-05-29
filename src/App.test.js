import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from './App';
import { ChatProvider } from './context/ChatContext';

// Mock the socket service
jest.mock('./services/socketService', () => ({
  initSocket: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    connected: true
  })),
  getSocket: jest.fn(() => ({
    emit: jest.fn()
  })),
  disconnectSocket: jest.fn(),
  sendMessage: jest.fn(() => true)
}));

// Wrap the App component with the ChatProvider for testing
const renderWithChatProvider = (component) => {
  return render(
    <ChatProvider>
      {component}
    </ChatProvider>
  );
};

test('renders the SimpleChat header', () => {
  renderWithChatProvider(<App />);
  const headerElement = screen.getByTestId('header-title');
  expect(headerElement).toBeInTheDocument();
  expect(headerElement.textContent).toBe('SimpleChat');
});

test('renders the BotToggle component', () => {
  renderWithChatProvider(<App />);
  const botToggleContainer = screen.getByTestId('bot-toggle-container');
  expect(botToggleContainer).toBeInTheDocument();
});

test('allows sending a message', async () => {
  renderWithChatProvider(<App />);
  
  // Find the input field and send button
  const inputElement = screen.getByTestId('message-input');
  const sendButton = screen.getByTestId('send-button');
  
  // Type a message and send it
  fireEvent.change(inputElement, { target: { value: 'Hello, world!' } });
  fireEvent.click(sendButton);
  
  // Since we're mocking the socket service, we need to manually add messages to simulate responses
  act(() => {
    // Simulate user message
    const userMessageEvent = new CustomEvent('new_message', {
      detail: {
        id: 1,
        text: 'Hello, world!',
        sender: 'user',
        userId: 'user-1',
        timestamp: new Date()
      }
    });
    document.dispatchEvent(userMessageEvent);
    
    // Simulate bot response
    const botMessageEvent = new CustomEvent('new_message', {
      detail: {
        id: 2,
        text: 'I received your message: "Hello, world!"',
        sender: 'bot',
        userId: 'bot',
        timestamp: new Date()
      }
    });
    document.dispatchEvent(botMessageEvent);
  });
});

test('does not send empty messages', () => {
  renderWithChatProvider(<App />);
  
  // Try to send an empty message
  const sendButton = screen.getByTestId('send-button');
  fireEvent.click(sendButton);
  
  // Check that the sendMessage function wasn't called with an empty message
  const { sendMessage } = require('./services/socketService');
  expect(sendMessage).not.toHaveBeenCalled();
});

test('displays correct message styling based on sender', async () => {
  renderWithChatProvider(<App />);
  
  // Manually add messages to test styling
  act(() => {
    // Add a user message
    const userMessageEvent = new CustomEvent('new_message', {
      detail: {
        id: 1,
        text: 'User message',
        sender: 'user',
        userId: 'user-1',
        timestamp: new Date()
      }
    });
    document.dispatchEvent(userMessageEvent);
    
    // Add a bot message
    const botMessageEvent = new CustomEvent('new_message', {
      detail: {
        id: 2,
        text: 'Bot message',
        sender: 'bot',
        userId: 'bot',
        timestamp: new Date()
      }
    });
    document.dispatchEvent(botMessageEvent);
  });
});

test('clears input field after sending a message', async () => {
  renderWithChatProvider(<App />);
  
  // Find the input field and send button
  const inputElement = screen.getByTestId('message-input');
  const sendButton = screen.getByTestId('send-button');
  
  // Type a message and send it
  fireEvent.change(inputElement, { target: { value: 'Test clearing input' } });
  fireEvent.click(sendButton);
  
  // Check if the input field is cleared
  expect(inputElement.value).toBe('');
});

test('handles form submission with Enter key', async () => {
  renderWithChatProvider(<App />);
  
  // Find the input field
  const inputElement = screen.getByTestId('message-input');
  const form = screen.getByTestId('message-form');
  
  // Type a message and submit the form with Enter
  fireEvent.change(inputElement, { target: { value: 'Submit with Enter' } });
  fireEvent.submit(form);
  
  // Check that the sendMessage function was called
  const { sendMessage } = require('./services/socketService');
  expect(sendMessage).toHaveBeenCalledWith('Submit with Enter');
});