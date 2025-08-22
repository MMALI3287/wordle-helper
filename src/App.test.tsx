import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Wordle Helper title', () => {
  render(<App />);
  const titleElement = screen.getByText(/wordle helper.*drag and drop/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders all letter cards section', () => {
  render(<App />);
  const allLettersElement = screen.getByText(/all letter cards/i);
  expect(allLettersElement).toBeInTheDocument();
});

test('renders alphabet letters', () => {
  render(<App />);
  // Check for presence of some alphabet letters
  const letterA = screen.getByText('A');
  const letterZ = screen.getByText('Z');
  expect(letterA).toBeInTheDocument();
  expect(letterZ).toBeInTheDocument();
});

test('renders drag zones', () => {
  render(<App />);
  const yellowZone = screen.getByText(/letters in word.*yellow/i);
  const grayZone = screen.getByText(/letters not in word.*gray/i);
  const positionsZone = screen.getByText(/known positions.*green/i);
  
  expect(yellowZone).toBeInTheDocument();
  expect(grayZone).toBeInTheDocument();
  expect(positionsZone).toBeInTheDocument();
});

test('renders word suggestions section', () => {
  render(<App />);
  const suggestionsElement = screen.getByText(/word suggestions/i);
  expect(suggestionsElement).toBeInTheDocument();
});

test('renders position slots numbered 1-5', () => {
  render(<App />);
  const position1 = screen.getByText('1');
  const position5 = screen.getByText('5');
  expect(position1).toBeInTheDocument();
  expect(position5).toBeInTheDocument();
});
