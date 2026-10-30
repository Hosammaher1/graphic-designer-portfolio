import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DevicePreviewFrame, DEVICE_VIEWPORTS } from '../src/page-builder/DevicePreviewFrame.jsx';
import { BuilderCanvas } from '../src/page-builder/BuilderCanvas.jsx';

describe('Page Builder Device Previews (Task 05.07)', () => {
  const sampleBlocks = [
    {
      id: 'blk-hero-test',
      type: 'hero',
      data: {
        title: 'واجهة تصميم استثنائية',
        subtitle: 'تصميم تجارب رقمية ملهمة',
        cta_text: 'استكشف أعمالنا',
        cta_url: '/ar/work',
        align: 'center',
      },
      settings: {
        bg_theme: 'surface',
      },
    },
    {
      id: 'blk-cta-test',
      type: 'cta',
      data: {
        title: 'دعوة للتواصل السريع',
        button_text: 'تواصل الآن',
      },
    },
  ];

  it('renders device preview toolbar with Desktop as default active viewport', () => {
    render(
      <DevicePreviewFrame locale="ar">
        <div data-testid="preview-child">محتوى المعاينة</div>
      </DevicePreviewFrame>
    );

    const desktopBtn = screen.getByRole('button', { name: /سطح المكتب|desktop/i });
    const tabletBtn = screen.getByRole('button', { name: /جهاز لوحي|tablet/i });
    const mobileBtn = screen.getByRole('button', { name: /هاتف ذكي|mobile/i });

    expect(desktopBtn).toBeInTheDocument();
    expect(tabletBtn).toBeInTheDocument();
    expect(mobileBtn).toBeInTheDocument();

    expect(desktopBtn).toHaveAttribute('aria-pressed', 'true');
    expect(tabletBtn).toHaveAttribute('aria-pressed', 'false');
    expect(mobileBtn).toHaveAttribute('aria-pressed', 'false');

    const viewportContainer = screen.getByTestId('device-preview-viewport');
    expect(viewportContainer).toHaveClass('viewport-desktop');
  });

  it('switches viewport to Tablet (768px) and updates active state and styling', () => {
    render(
      <DevicePreviewFrame locale="ar">
        <div data-testid="preview-child">محتوى المعاينة</div>
      </DevicePreviewFrame>
    );

    const tabletBtn = screen.getByRole('button', { name: /جهاز لوحي|tablet/i });
    fireEvent.click(tabletBtn);

    expect(tabletBtn).toHaveAttribute('aria-pressed', 'true');
    const desktopBtn = screen.getByRole('button', { name: /سطح المكتب|desktop/i });
    expect(desktopBtn).toHaveAttribute('aria-pressed', 'false');

    const viewportContainer = screen.getByTestId('device-preview-viewport');
    expect(viewportContainer).toHaveClass('viewport-tablet');
    expect(viewportContainer.style.maxWidth).toBe('768px');
  });

  it('switches viewport to Mobile (390px) and updates active state and styling', () => {
    render(
      <DevicePreviewFrame locale="en">
        <div data-testid="preview-child">Preview Content</div>
      </DevicePreviewFrame>
    );

    const mobileBtn = screen.getByRole('button', { name: /mobile/i });
    fireEvent.click(mobileBtn);

    expect(mobileBtn).toHaveAttribute('aria-pressed', 'true');

    const viewportContainer = screen.getByTestId('device-preview-viewport');
    expect(viewportContainer).toHaveClass('viewport-mobile');
    expect(viewportContainer.style.maxWidth).toBe('390px');
  });

  it('preserves child content and document state across all viewport transitions', () => {
    render(
      <DevicePreviewFrame locale="ar">
        <div data-testid="preview-child">
          <h1>عنوان الصفحة التجريبي</h1>
          <p>فقرة توضيحية كاملة للمعاينة</p>
        </div>
      </DevicePreviewFrame>
    );

    expect(screen.getByText('عنوان الصفحة التجريبي')).toBeInTheDocument();
    expect(screen.getByText('فقرة توضيحية كاملة للمعاينة')).toBeInTheDocument();

    // Switch to tablet
    fireEvent.click(screen.getByRole('button', { name: /جهاز لوحي|tablet/i }));
    expect(screen.getByText('عنوان الصفحة التجريبي')).toBeInTheDocument();

    // Switch to mobile
    fireEvent.click(screen.getByRole('button', { name: /هاتف ذكي|mobile/i }));
    expect(screen.getByText('عنوان الصفحة التجريبي')).toBeInTheDocument();

    // Switch back to desktop
    fireEvent.click(screen.getByRole('button', { name: /سطح المكتب|desktop/i }));
    expect(screen.getByText('عنوان الصفحة التجريبي')).toBeInTheDocument();
    expect(screen.getByText('فقرة توضيحية كاملة للمعاينة')).toBeInTheDocument();
  });

  it('integrates device preview toolbar within BuilderCanvas maintaining live editing consistency', () => {
    render(<BuilderCanvas pageId="test-preview" initialBlocks={sampleBlocks} locale="ar" />);

    // Check device preview controls exist inside canvas
    const mobileBtn = screen.getByRole('button', { name: /هاتف ذكي|mobile/i });
    expect(mobileBtn).toBeInTheDocument();

    // Switch to mobile
    fireEvent.click(mobileBtn);
    expect(mobileBtn).toHaveAttribute('aria-pressed', 'true');

    const viewport = screen.getByTestId('device-preview-viewport');
    expect(viewport).toHaveClass('viewport-mobile');

    // Verify block content still rendered in mobile preview
    const matches = screen.getAllByText('واجهة تصميم استثنائية');
    expect(matches.length).toBeGreaterThan(0);
  });
});
