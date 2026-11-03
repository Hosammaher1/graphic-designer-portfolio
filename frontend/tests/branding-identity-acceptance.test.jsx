import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Navbar } from '../src/components/Navbar.jsx';
import { AboutSection } from '../src/components/AboutSection.jsx';
import { Footer } from '../src/components/Footer.jsx';
import { ContactSection } from '../src/components/ContactSection.jsx';

const mockSettings = {
  profile: {
    name: 'Mohammed Maher Aldaya',
    nameAr: 'محمد ماهر الداية',
    fullNameEn: 'Mohammed Maher Aldaya',
    fullNameAr: 'محمد ماهر الداية',
    titleEn: 'Graphic Designer | Visual Identity & Creative Design',
    titleAr: 'مصمم جرافيك | متخصص في الهوية البصرية والتصميم الإبداعي',
    profilePhoto: '/profile/mohammed-maher-profile.png',
    email: 'mohmmed.maher467@gmail.com',
    instagramUrl: 'https://www.instagram.com/mohmmed_ma48/',
    instagramHandle: '@mohmmed_ma48',
    whatsappNumber: '+972592382189',
    whatsappDisplay: '+972 59-238-2189',
    whatsappUrl: 'https://wa.me/972592382189',
  },
  contact: {
    directEmail: 'mohmmed.maher467@gmail.com',
    instagramUrl: 'https://www.instagram.com/mohmmed_ma48/',
    instagramHandle: '@mohmmed_ma48',
    whatsappNumber: '+972592382189',
    whatsappDisplay: '+972 59-238-2189',
    whatsappUrl: 'https://wa.me/972592382189',
  },
  branding: {
    monogram: 'MO',
    logoUrl: '/logo/logo.png',
  },
};

describe('Branding, Identity, and Navigation Acceptance', () => {
  describe('Navbar Branding & Text Removal', () => {
    it('displays only the official MO logo without designer name or brand text in English', () => {
      render(
        <Navbar
          lang="en"
          onToggleLanguage={() => {}}
          activeSection="hero"
          currentRoute="home"
          onNavigateRoute={() => {}}
          settings={mockSettings}
        />
      );

      const logo = screen.getByTestId('navbar-brand-logo');
      expect(logo).toBeInTheDocument();
      const img = logo.querySelector('img');
      expect(img).toHaveAttribute('src', '/logo/logo.png');
      expect(img).toHaveAttribute('alt', 'MO');

      // Crucial requirement: Designer name must NOT be present in Navbar
      expect(logo.textContent).not.toContain('Mohammed');
      expect(logo.textContent).not.toContain('Maher');
      expect(logo.textContent).not.toContain('Graphic Designer');
    });

    it('displays only the official MO logo without designer name or brand text in Arabic', () => {
      render(
        <Navbar
          lang="ar"
          onToggleLanguage={() => {}}
          activeSection="hero"
          currentRoute="home"
          onNavigateRoute={() => {}}
          settings={mockSettings}
        />
      );

      const logo = screen.getByTestId('navbar-brand-logo');
      expect(logo).toBeInTheDocument();
      expect(logo.textContent).not.toContain('محمد');
      expect(logo.textContent).not.toContain('ماهر');
    });
  });

  describe('About Me Identity & Official Profile Photo', () => {
    it('prominently displays full English name, professional title, and official portrait', () => {
      render(<AboutSection lang="en" settings={mockSettings} />);

      expect(screen.getByTestId('about-designer-name')).toHaveTextContent('Mohammed Maher Aldaya');
      expect(screen.getByTestId('about-designer-title')).toHaveTextContent('Graphic Designer | Visual Identity & Creative Design');

      const portrait = screen.getByTestId('about-profile-image');
      expect(portrait).toBeInTheDocument();
      expect(portrait).toHaveAttribute('src', '/profile/mohammed-maher-profile.png');
      expect(portrait).toHaveAttribute('alt', 'Mohammed Maher Aldaya');
    });

    it('prominently displays full Arabic name, professional title, and official portrait', () => {
      render(<AboutSection lang="ar" settings={mockSettings} />);

      expect(screen.getByTestId('about-designer-name')).toHaveTextContent('محمد ماهر الداية');
      expect(screen.getByTestId('about-designer-title')).toHaveTextContent('مصمم جرافيك | متخصص في الهوية البصرية والتصميم الإبداعي');

      const portrait = screen.getByTestId('about-profile-image');
      expect(portrait).toBeInTheDocument();
      expect(portrait).toHaveAttribute('src', '/profile/mohammed-maher-profile.png');
      expect(portrait).toHaveAttribute('alt', 'محمد ماهر الداية');
    });
  });

  describe('Public Footer Admin Link Removal', () => {
    it('does not display any Admin link or dashboard reference in English', () => {
      render(<Footer lang="en" settings={mockSettings} />);

      expect(screen.queryByRole('link', { name: /^admin$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
    });

    it('does not display any Admin link or dashboard reference in Arabic', () => {
      render(<Footer lang="ar" settings={mockSettings} />);

      expect(screen.queryByRole('link', { name: /لوحة التحكم/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /إدارة/i })).not.toBeInTheDocument();
    });
  });

  describe('Contact Section Channels', () => {
    it('provides direct, clickable links for Email, WhatsApp, and Instagram', () => {
      render(<ContactSection lang="en" settings={mockSettings} />);

      const emailLink = screen.getByTestId('contact-card-email');
      expect(emailLink).toHaveAttribute('href', 'mailto:mohmmed.maher467@gmail.com');

      const whatsappLink = screen.getByTestId('contact-card-whatsapp');
      expect(whatsappLink).toHaveAttribute('href', 'https://wa.me/972592382189');
      expect(whatsappLink).toHaveAttribute('target', '_blank');
      expect(whatsappLink).toHaveAttribute('rel', 'noopener noreferrer');

      const instagramLink = screen.getByTestId('contact-card-instagram');
      expect(instagramLink).toHaveAttribute('href', 'https://www.instagram.com/mohmmed_ma48/');
      expect(instagramLink).toHaveAttribute('target', '_blank');
      expect(instagramLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
