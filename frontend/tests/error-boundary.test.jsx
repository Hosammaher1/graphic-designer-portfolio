import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../src/components/ErrorBoundary.jsx';

function BuggyComponent({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error('Simulated crash in component rendering');
  }
  return <div data-testid="child-content">Normal render content</div>;
}

describe('ErrorBoundary Component', () => {
  let originalConsoleError;

  beforeEach(() => {
    originalConsoleError = console.error;
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <BuggyComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child-content')).toHaveTextContent('Normal render content');
  });

  it('catches render error and displays bilingual error UI with reload button', () => {
    render(
      <ErrorBoundary>
        <BuggyComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong \/ حدث خطأ غير متوقع/i)).toBeInTheDocument();
    expect(screen.getByText(/Refresh Page \/ إعادة تحميل الصفحة/i)).toBeInTheDocument();
  });
});
