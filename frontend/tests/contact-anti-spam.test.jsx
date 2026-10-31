import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ContactPage from '../src/pages/ContactPage.jsx';

describe('Contact Anti-Spam & Rate Limiting (Task 07.06)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders hidden honeypot inputs inaccessible to human visual flow', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/en/contact']}>
        <ContactPage locale="en" />
      </MemoryRouter>
    );

    const websiteHoneypot = container.querySelector('input[name="website"]');
    expect(websiteHoneypot).not.toBeNull();
    expect(websiteHoneypot.getAttribute('tabindex')).toBe('-1');
    expect(websiteHoneypot.getAttribute('aria-hidden')).toBe('true');

    const faxHoneypot = container.querySelector('input[name="hp_fax"]');
    expect(faxHoneypot).not.toBeNull();
    expect(faxHoneypot.getAttribute('tabindex')).toBe('-1');
    expect(faxHoneypot.getAttribute('aria-hidden')).toBe('true');
  });

  it('drops submission immediately if bot populates honeypot input', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const { container } = render(
      <MemoryRouter initialEntries={['/en/contact']}>
        <ContactPage locale="en" />
      </MemoryRouter>
    );

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/your email/i);
    const msgInput = screen.getByLabelText(/project scope & details/i);
    const faxHoneypot = container.querySelector('input[name="hp_fax"]');
    const submitBtn = screen.getByRole('button', { name: /send message/i });

    fireEvent.change(nameInput, { target: { value: 'Bot Spammer' } });
    fireEvent.change(emailInput, { target: { value: 'bot@spam.com' } });
    fireEvent.change(msgInput, { target: { value: 'Automated spam message payload.' } });
    fireEvent.change(faxHoneypot, { target: { value: 'http://spam.xyz' } });

    fireEvent.click(submitBtn);

    // Fetch should never be called
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('sends submission timestamp and displays rate limit message on 429 response', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({
        status: 'error',
        message: 'Too many contact inquiries from this IP. Please wait a minute before retrying.',
      }),
    });

    render(
      <MemoryRouter initialEntries={['/en/contact']}>
        <ContactPage locale="en" />
      </MemoryRouter>
    );

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/your email/i);
    const msgInput = screen.getByLabelText(/project scope & details/i);
    const submitBtn = screen.getByRole('button', { name: /send message/i });

    fireEvent.change(nameInput, { target: { value: 'Frequent Sender' } });
    fireEvent.change(emailInput, { target: { value: 'frequent@sender.com' } });
    fireEvent.change(msgInput, { target: { value: 'Valid message sent multiple times to trigger limiter.' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    // Verify timestamp was included in body
    const requestBody = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(requestBody._timestamp).toBeDefined();
    expect(typeof requestBody._timestamp).toBe('number');

    // Verify 429 rate limit alert is displayed
    await waitFor(() => {
      expect(screen.getByText(/too many contact inquiries from this ip/i)).toBeInTheDocument();
    });
  });
});
