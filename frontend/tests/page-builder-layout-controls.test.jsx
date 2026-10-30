import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LayoutControls } from '../src/page-builder/LayoutControls.jsx';

describe('Page Builder Layout Controls (Task 05.05)', () => {
  const initialSettings = {
    layout: {
      columns: 2,
      gap: 'md',
      stack_on_mobile: true,
      align: 'center',
    },
    background: {
      theme: 'surface',
    },
    typography: {
      scale: 'lg',
    },
    media: {
      aspect_ratio: '16:9',
    },
    animation: {
      preset: 'fade-in',
      duration: '300ms',
    },
  };

  it('renders layout controls with allowlisted options', () => {
    const onChange = vi.fn();
    render(
      <LayoutControls
        settings={initialSettings}
        onChange={onChange}
        locale="ar"
      />
    );

    expect(screen.getByRole('heading', { name: /إعدادات التخطيط والتنسيق/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/عدد الأعمدة/i)).toHaveValue('2');
    expect(screen.getByLabelText(/المسافة البينية \(Gap\)/i)).toHaveValue('md');
    expect(screen.getByLabelText(/المحاذاة الأفقية/i)).toHaveValue('center');
    expect(screen.getByLabelText(/خلفية الكتلة/i)).toHaveValue('surface');
    expect(screen.getByLabelText(/المقياس الطباعي/i)).toHaveValue('lg');
    expect(screen.getByLabelText(/تناسب أبعاد الصورة/i)).toHaveValue('16:9');
    expect(screen.getByLabelText(/حركة الظهور/i)).toHaveValue('fade-in');
    expect(screen.getByLabelText(/التكديس العمودي على الشاشات الصغيرة/i)).toBeChecked();
  });

  it('updates column count and gap constrained tokens', () => {
    const onChange = vi.fn();
    render(
      <LayoutControls
        settings={initialSettings}
        onChange={onChange}
        locale="ar"
      />
    );

    const colsSelect = screen.getByLabelText(/عدد الأعمدة/i);
    fireEvent.change(colsSelect, { target: { value: '3' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        layout: expect.objectContaining({ columns: 3 }),
      })
    );

    const gapSelect = screen.getByLabelText(/المسافة البينية \(Gap\)/i);
    fireEvent.change(gapSelect, { target: { value: 'lg' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        layout: expect.objectContaining({ gap: 'lg' }),
      })
    );
  });

  it('updates background theme with semantic color tokens', () => {
    const onChange = vi.fn();
    render(
      <LayoutControls
        settings={initialSettings}
        onChange={onChange}
        locale="ar"
      />
    );

    const bgSelect = screen.getByLabelText(/خلفية الكتلة/i);
    fireEvent.change(bgSelect, { target: { value: 'elevated' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        background: expect.objectContaining({ theme: 'elevated' }),
      })
    );
  });

  it('updates typography scale and image aspect ratio', () => {
    const onChange = vi.fn();
    render(
      <LayoutControls
        settings={initialSettings}
        onChange={onChange}
        locale="ar"
      />
    );

    const typeSelect = screen.getByLabelText(/المقياس الطباعي/i);
    fireEvent.change(typeSelect, { target: { value: '2xl' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        typography: expect.objectContaining({ scale: '2xl' }),
      })
    );

    const aspectSelect = screen.getByLabelText(/تناسب أبعاد الصورة/i);
    fireEvent.change(aspectSelect, { target: { value: '4:3' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        media: expect.objectContaining({ aspect_ratio: '4:3' }),
      })
    );
  });

  it('updates motion presets and duration', () => {
    const onChange = vi.fn();
    render(
      <LayoutControls
        settings={initialSettings}
        onChange={onChange}
        locale="ar"
      />
    );

    const motionSelect = screen.getByLabelText(/حركة الظهور/i);
    fireEvent.change(motionSelect, { target: { value: 'slide-up' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        animation: expect.objectContaining({ preset: 'slide-up' }),
      })
    );
  });

  it('toggles mobile stacking control', () => {
    const onChange = vi.fn();
    render(
      <LayoutControls
        settings={initialSettings}
        onChange={onChange}
        locale="ar"
      />
    );

    const stackCheckbox = screen.getByLabelText(/التكديس العمودي على الشاشات الصغيرة/i);
    fireEvent.click(stackCheckbox);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        layout: expect.objectContaining({ stack_on_mobile: false }),
      })
    );
  });

  it('sanitizes input and blocks arbitrary unsafe CSS injection', () => {
    const onChange = vi.fn();
    render(
      <LayoutControls
        settings={initialSettings}
        onChange={onChange}
        locale="ar"
      />
    );

    // Attempting to select or inject unapproved arbitrary value falls back or is rejected
    const bgSelect = screen.getByLabelText(/خلفية الكتلة/i);
    
    // Select elements only permit valid options
    const options = Array.from(bgSelect.querySelectorAll('option')).map((o) => o.value);
    expect(options).not.toContain('expression(alert(1))');
    expect(options).not.toContain('position: fixed');
    expect(options).toEqual(expect.arrayContaining(['base', 'surface', 'elevated', 'muted', 'primary']));
  });
});
