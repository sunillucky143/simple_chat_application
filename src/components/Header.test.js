import { render, screen } from '@testing-library/react';
import Header from './Header';

test('renders the header with correct title', () => {
  render(<Header />);
  const headerElement = screen.getByText(/SimpleChat/i);
  expect(headerElement).toBeInTheDocument();
});