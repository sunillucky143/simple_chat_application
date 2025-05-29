import { render, screen } from '@testing-library/react';
import MessageDisplay from './MessageDisplay';

test('renders messages correctly', () => {
  const testMessages = [
    { id: 1, text: 'Hello', sender: 'user', timestamp: new Date() },
    { id: 2, text: 'Hi there', sender: 'bot', timestamp: new Date() }
  ];
  
  render(<MessageDisplay messages={testMessages} />);
  
  expect(screen.getByText('Hello')).toBeInTheDocument();
  expect(screen.getByText('Hi there')).toBeInTheDocument();
});

test('renders empty state when no messages', () => {
  render(<MessageDisplay messages={[]} />);
  
  // The container should be empty but present
  const container = screen.getByRole('generic');
  expect(container).toBeInTheDocument();
  expect(container.children.length).toBe(0);
});