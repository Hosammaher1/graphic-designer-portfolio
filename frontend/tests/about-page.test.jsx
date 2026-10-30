import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import AboutPage from '../src/pages/AboutPage.jsx';

describe('About Page (Task 04.06)', () => {
  it('renders biography, design philosophy, skills, tools, and experience in English', () => {
    render(
      <MemoryRouter initialEntries={['/en/about']}>
        <AboutPage locale="en" />
      </MemoryRouter>
    );

    // Title and lead
    expect(screen.getByRole('heading', { level: 1, name: /about mohammed/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /journey & design vision/i })).toBeInTheDocument();

    // Design philosophy
    expect(screen.getByRole('heading', { name: /design philosophy/i })).toBeInTheDocument();
    expect(screen.getByText(/intentional simplicity/i)).toBeInTheDocument();
    expect(screen.getByText(/typographic precision/i)).toBeInTheDocument();
    expect(screen.getByText(/tactile & material craft/i)).toBeInTheDocument();

    // Skills & Tools
    expect(screen.getByRole('heading', { name: /disciplines & expertise/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /tools & technologies/i })).toBeInTheDocument();
    expect(screen.getByText(/adobe illustrator/i)).toBeInTheDocument();

    // Experience
    expect(screen.getByRole('heading', { name: /selected milestones & experience/i })).toBeInTheDocument();
  });

  it('renders translated content correctly in Arabic', () => {
    render(
      <MemoryRouter initialEntries={['/ar/about']}>
        <AboutPage locale="ar" />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /عن المصمم/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /فلسفة التصميم/i })).toBeInTheDocument();
    expect(screen.getByText(/البساطة الهادفة/i)).toBeInTheDocument();
    expect(screen.getByText(/الدقة التيبوغرافية/i)).toBeInTheDocument();
  });

  it('renders downloadable CV button when cvUrl is supplied', () => {
    render(
      <MemoryRouter initialEntries={['/en/about']}>
        <AboutPage locale="en" cvUrl="/assets/mohammed-resume.pdf" />
      </MemoryRouter>
    );

    const cvLink = screen.getByRole('link', { name: /download curriculum vitae/i });
    expect(cvLink).toBeInTheDocument();
    expect(cvLink).toHaveAttribute('href', '/assets/mohammed-resume.pdf');
    expect(cvLink).toHaveAttribute('download');
  });

  it('renders graceful fallback when CV asset is missing without broken links', () => {
    render(
      <MemoryRouter initialEntries={['/en/about']}>
        <AboutPage locale="en" cvUrl={null} />
      </MemoryRouter>
    );

    expect(screen.getByText(/curriculum vitae is available upon request/i)).toBeInTheDocument();
    const requestBtn = screen.getByRole('link', { name: /request cv/i });
    expect(requestBtn).toBeInTheDocument();
    expect(requestBtn).toHaveAttribute('href', '/en/contact');
  });
});
