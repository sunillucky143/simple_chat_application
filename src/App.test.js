import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

test('renders the SimpleChat header', () => {
  render(<App />);
  const headerElement = screen.getByText(/SimpleChat/i);
  expect(headerElement).toBeInTheDocument();
});

test('allows sending a message', async () => {
  render(<App />);
  
  // Find the input field and send button
  const inputElement = screen.getByPlaceholderText(/Type a message/i);
  const sendButton = screen.getByText(/Send/i);
  
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
  const initialMessages = screen.getAllByText(/./i).filter(
    element => element.closest('div').className.includes('rounded-lg p-3')
  );
  
  // Try to send an empty message
  const sendButton = screen.getByText(/Send/i);
  fireEvent.click(sendButton);
  
  // Check that no new messages were added
  const messagesAfterClick = screen.getAllByText(/./i).filter(
    element => element.closest('div').className.includes('rounded-lg p-3')
  );
  
  expect(messagesAfterClick.length).toBe(initialMessages.length);
});