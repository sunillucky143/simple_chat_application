import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BotToggle from './BotToggle';
import { useChat } from '../context/ChatContext';

// Mock the ChatContext hook
jest.mock('../context/ChatContext', () => ({
  useChat: jest.fn()
}));

describe('BotToggle Component', () => {
  const mockToggleBot = jest.fn();
  
  beforeEach(() => {
    // Reset mock function calls
    mockToggleBot.mockReset();
  });
  
  test('renders correctly when bot is enabled', () => {
    // Mock the context values
    useChat.mockReturnValue({
      botEnabled: true,
      toggleBot: mockToggleBot
    });
    
    render(<BotToggle />);
    
    // Check if the toggle button is rendered
    const toggleButton = screen.getByTestId('bot-toggle-button');
    expect(toggleButton).toBeInTheDocument();
    
    // Check if the status text shows "Enabled"
    const statusText = screen.getByTestId('bot-status');
    expect(statusText).toHaveTextContent('Enabled');
    
    // Check if the button has the correct aria-pressed attribute
    expect(toggleButton).toHaveAttribute('aria-pressed', 'true');
  });
  
  test('renders correctly when bot is disabled', () => {
    // Mock the context values
    useChat.mockReturnValue({
      botEnabled: false,
      toggleBot: mockToggleBot
    });
    
    render(<BotToggle />);
    
    // Check if the toggle button is rendered
    const toggleButton = screen.getByTestId('bot-toggle-button');
    expect(toggleButton).toBeInTheDocument();
    
    // Check if the status text shows "Disabled"
    const statusText = screen.getByTestId('bot-status');
    expect(statusText).toHaveTextContent('Disabled');
    
    // Check if the button has the correct aria-pressed attribute
    expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
  });
  
  test('calls toggleBot when clicked', () => {
    // Mock the context values
    useChat.mockReturnValue({
      botEnabled: true,
      toggleBot: mockToggleBot
    });
    
    render(<BotToggle />);
    
    // Click the toggle button
    const toggleButton = screen.getByTestId('bot-toggle-button');
    fireEvent.click(toggleButton);
    
    // Check if toggleBot was called
    expect(mockToggleBot).toHaveBeenCalledTimes(1);
  });
});