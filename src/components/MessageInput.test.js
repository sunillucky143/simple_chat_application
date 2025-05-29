import { render, screen, fireEvent } from '@testing-library/react';
import MessageInput from './MessageInput';

test('renders input field and send button', () => {
  render(<MessageInput onSendMessage={() => {}} />);
  
  const inputElement = screen.getByPlaceholderText(/Type a message/i);
  expect(inputElement).toBeInTheDocument();
  
  const sendButton = screen.getByText(/Send/i);
  expect(sendButton).toBeInTheDocument();
});

test('updates input value when typing', () => {
  render(<MessageInput onSendMessage={() => {}} />);
  
  const inputElement = screen.getByPlaceholderText(/Type a message/i);
  fireEvent.change(inputElement, { target: { value: 'Test message' } });
  
  expect(inputElement.value).toBe('Test message');
});

test('calls onSendMessage when form is submitted', () => {
  const mockSendMessage = jest.fn();
  render(<MessageInput onSendMessage={mockSendMessage} />);
  
  const inputElement = screen.getByPlaceholderText(/Type a message/i);
  const sendButton = screen.getByText(/Send/i);
  
  fireEvent.change(inputElement, { target: { value: 'Test message' } });
  fireEvent.click(sendButton);
  
  expect(mockSendMessage).toHaveBeenCalledWith('Test message');
  expect(inputElement.value).toBe(''); // Input should be cleared after sending
});

test('does not call onSendMessage for empty messages', () => {
  const mockSendMessage = jest.fn();
  render(<MessageInput onSendMessage={mockSendMessage} />);
  
  const sendButton = screen.getByText(/Send/i);
  fireEvent.click(sendButton);
  
  expect(mockSendMessage).not.toHaveBeenCalled();
});