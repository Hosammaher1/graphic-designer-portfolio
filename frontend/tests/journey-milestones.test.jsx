import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JourneyPage } from '../src/admin/pages/JourneyPage.jsx';
import { JourneySection } from '../src/components/JourneySection.jsx';
import { AdminProvider } from '../src/admin/context/AdminContext.jsx';

describe('Creative Journey & Milestones Integration', () => {
  it('renders JourneyPage in Admin dashboard with milestone list and actions', () => {
    render(
      <AdminProvider initialPath="/admin/journey">
        <JourneyPage />
      </AdminProvider>
    );

    // Verify title and Add Milestone button
    expect(screen.getAllByText(/Creative Journey/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Add Milestone/i })).toBeInTheDocument();

    // Verify seeded milestones appear (e.g. 2022 Education, 2024 Freelance Experience, etc.)
    expect(screen.getAllByText(/Education/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Freelance Experience/i)).toBeInTheDocument();
    expect(screen.getByText('2022')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
  });

  it('opens Add Milestone modal on button click with bilingual fields', () => {
    render(
      <AdminProvider initialPath="/admin/journey">
        <JourneyPage />
      </AdminProvider>
    );

    const addBtn = screen.getByRole('button', { name: /Add Milestone/i });
    fireEvent.click(addBtn);

    // Verify modal inputs are present
    expect(screen.getByPlaceholderText(/e.g. Senior Art Director/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/مثال: مدير فني أول/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
  });

  it('renders public JourneySection component with localized timeline', () => {
    const { container: containerEn } = render(<JourneySection lang="en" />);
    expect(containerEn.querySelector('#creative-journey')).toBeInTheDocument();
    expect(screen.getAllByText(/Journey/i).length).toBeGreaterThan(0);

    const { container: containerAr } = render(<JourneySection lang="ar" />);
    expect(containerAr.querySelector('#creative-journey')).toBeInTheDocument();
  });
});
