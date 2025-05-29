import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from './App';

test('renders the SimpleChat header', () => {
  render(<App />);
  const headerElement = screen.getByTestId('header-title');
  expect(headerElement).toBeInTheDocument();
  expect(headerElement.textContent).toBe('SimpleChat');
});

test('allows sending a message', async () => {
  render(<App />);
  
  // Find the input field and send button
  const inputElement = screen.getByTestId('message-input');
  const sendButton = screen.getByTestId('send-button');
  
  // Type a message and send it
  fireEvent.change(inputElement, { target: { value: 'Hello, world!' } });
  fireEvent.click(sendButton);
  
  // Check if the user message appears
  expect(await screen.findByText('Hello, world!')).toBeInTheDocument();
  
  // Check if the bot responds
  await waitFor(() => {
    expect(screen.getByText(/I received your message: "Hello, world!"/i)).toBeInTheDocument();
  });
});

test('does not send empty messages', () => {
  render(<App />);
  
  // Get the initial message count
  const initialMessages = screen.getAllByTestId('message-bubble');
  
  // Try to send an empty message
  const sendButton = screen.getByTestId('send-button');
  fireEvent.click(sendButton);
  
  // Check that no new messages were added
  const messagesAfterClick = screen.getAllByTestId('message-bubble');
  
  expect(messagesAfterClick.length).toBe(initialMessages.length);
});

test('displays correct message styling based on sender', async () => {
  render(<App />);
  
  // Send a user message
  const inputElement = screen.getByTestId('message-input');
  const sendButton = screen.getByTestId('send-button');
  
  fireEvent.change(inputElement, { target: { value: 'Test message' } });
  fireEvent.click(sendButton);
  
  // Wait for both messages to appear
  await waitFor(() => {
    const messageBubbles = screen.getAllByTestId('message-bubble');
    expect(messageBubbles.length).toBe(3); // Initial bot + user + bot response
  });
  
  // Check that user and bot messages have different styling
  const messageBubbles = screen.getAllByTestId('message-bubble');
  
  // Find user message
  const userMessage = Array.from(messageBubbles).find(
    bubble => bubble.getAttribute('data-sender') === 'user'
  );
  
  // Find bot messages
  const botMessages = Array.from(messageBubbles).filter(
    bubble => bubble.getAttribute('data-sender') === 'bot'
  );
  
  expect(userMessage).toHaveClass('bg-blue-500');
  expect(botMessages[0]).toHaveClass('bg-gray-200');
});

test('auto-scrolls when new messages are added', async () => {
  render(<App />);
  
  // Mock the scrollHeight and scrollTop properties
  const messageDisplay = screen.getByTestId('message-display');
  Object.defineProperty(messageDisplay, 'scrollHeight', { value: 1000 });
  Object.defineProperty(messageDisplay, 'scrollTop', { value: 0, writable: true });
  
  // Send a message
  const inputElement = screen.getByTestId('message-input');
  const sendButton = screen.getByTestId('send-button');
  
  fireEvent.change(inputElement, { target: { value: 'Test auto-scroll' } });
  fireEvent.click(sendButton);
  
  // Wait for the bot response
  await waitFor(() => {
    expect(screen.getByText(/I received your message: "Test auto-scroll"/i)).toBeInTheDocument();
  });
  
  // Check if scrollTop was set to scrollHeight
  expect(messageDisplay.scrollTop).toBe(messageDisplay.scrollHeight);
});

test('clears input field after sending a message', async () => {
  render(<App />);
  
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
  render(<App />);
  
  // Find the input field
  const inputElement = screen.getByTestId('message-input');
  const form = screen.getByTestId('message-form');
  
  // Type a message and submit the form with Enter
  fireEvent.change(inputElement, { target: { value: 'Submit with Enter' } });
  fireEvent.submit(form);
  
  // Check if the user message appears
  expect(await screen.findByText('Submit with Enter')).toBeInTheDocument();
  
  // Check if the bot responds
  await waitFor(() => {
    expect(screen.getByText(/I received your message: "Submit with Enter"/i)).toBeInTheDocument();
  });
});

test('displays timestamps on messages', () => {
  render(<App />);
  
  // Check if the initial bot message has a timestamp
  const timestampElements = screen.getAllByTestId('message-timestamp');
  expect(timestampElements.length).toBeGreaterThan(0);
  
  // Verify timestamp format (HH:MM format)
  const timestampText = timestampElements[0].textContent;
  expect(timestampText).toMatch(/^\d{1,2}:\d{2}$/);
});

test('handles multiple messages in sequence', async () => {
  jest.useFakeTimers();
  
  render(<App />);
  
  // Find the input field and send button
  const inputElement = screen.getByTestId('message-input');
  const sendButton = screen.getByTestId('send-button');
  
  // Send first message
  fireEvent.change(inputElement, { target: { value: 'First message' } });
  fireEvent.click(sendButton);
  
  // Send second message immediately
  fireEvent.change(inputElement, { target: { value: 'Second message' } });
  fireEvent.click(sendButton);
  
  // Fast-forward timers
  await act(async () => {
    jest.advanceTimersByTime(2000);
  });
  
  // Check if all messages appear
  expect(screen.getByText('First message')).toBeInTheDocument();
  expect(screen.getByText('Second message')).toBeInTheDocument();
  expect(screen.getByText(/I received your message: "First message"/i)).toBeInTheDocument();
  expect(screen.getByText(/I received your message: "Second message"/i)).toBeInTheDocument();
  
  // Check total number of messages (1 initial + 2 user + 2 bot = 5)
  const messageBubbles = screen.getAllByTestId('message-bubble');
  expect(messageBubbles.length).toBe(5);
  
  jest.useRealTimers();
});