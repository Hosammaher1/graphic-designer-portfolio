import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ContactPage from '../src/pages/ContactPage.jsx';

describe('Contact Page UI (Task 04.07)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders direct contact methods and form fields in English', () => {
    render(
      <MemoryRouter initialEntries={['/en/contact']}>
        <ContactPage locale="en" />
      </MemoryRouter>
    );

    // Header & direct channels
    expect(screen.getByRole('heading', { level: 1, name: /get in touch/i })).toBeInTheDocument();
    expect(screen.getByText('hello@mohammed-design.com')).toBeInTheDocument();
    expect(screen.getByText(/Cairo, Egypt/i)).toBeInTheDocument();

    // Form inputs
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/project type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/estimated budget/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/project scope & details/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  it('displays validation errors and sets aria-invalid when submitting empty form', async () => {
    render(
      <MemoryRouter initialEntries={['/en/contact']}>
        <ContactPage locale="en" />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/please enter your full name/i)).toBeInTheDocument();
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/please describe your project/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/full name/i);
    expect(nameInput).toHaveAttribute('aria-invalid', 'true');
  });

  it('validates email format properly', async () => {
    render(
      <MemoryRouter initialEntries={['/en/contact']}>
        <ContactPage locale="en" />
      </MemoryRouter>
    );

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/your email/i);
    const msgInput = screen.getByLabelText(/project scope & details/i);
    const submitBtn = screen.getByRole('button', { name: /send message/i });

    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    fireEvent.change(msgInput, { target: { value: 'A comprehensive branding project for studio.' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/please enter your full name/i)).not.toBeInTheDocument();
  });

  it('prevents duplicate submissions and disables button while submitting', async () => {
    render(
      <MemoryRouter initialEntries={['/en/contact']}>
        <ContactPage locale="en" />
      </MemoryRouter>
    );

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/your email/i);
    const msgInput = screen.getByLabelText(/project scope & details/i);
    const submitBtn = screen.getByRole('button', { name: /send message/i });

    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
    fireEvent.change(msgInput, { target: { value: 'We need a new visual identity for our product line.' } });

    fireEvent.click(submitBtn);

    // Button should be disabled and show busy/submitting state
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveAttribute('aria-busy', 'true');

    await waitFor(() => {
      expect(screen.getByText(/message saved locally in development mode/i)).toBeInTheDocument();
    });
  });

  it('renders translated form in Arabic', () => {
    render(
      <MemoryRouter initialEntries={['/ar/contact']}>
        <ContactPage locale="ar" />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /تواصل معي/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/الاسم الكامل/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/بريدك الإلكتروني/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /إرسال الرسالة/i })).toBeInTheDocument();
  });
});
