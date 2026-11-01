---
name: apple-design-system
description: Guidelines and design system specifications for Apple/iOS-inspired premium creative portfolios. Covers typography scales, whitespace hierarchy, subtle glassmorphism, refined light/dark mode palettes, and tactile micro-interactions.
---

# Apple-Inspired Premium Design System & UI/UX Guidelines

## 1. Core Visual Philosophy
- **Intentional Simplicity**: Every visual element serves a purpose. Content (the designer's creative work) is the hero; UI chrome recedes into the background.
- **Monumental Typography**: Contrasting ultra-large editorial display typography (e.g., `clamp(3.5rem, 8vw, 8.5rem)`) with precise, legible body text and monospace technical metadata tags.
- **Generous Whitespace & Asymmetry**: Large vertical breathing room (`py-24`, `py-32`) to establish rhythm and visual pacing.
- **Tactile Depth & Glassmorphism**: Controlled background blur (`backdrop-blur-md`, `backdrop-blur-lg`), 1px translucent borders (`border-stone-800/60` or `border-stone-200/80`), subtle layered shadows (`shadow-2xl`).
- **No Clutter**: Avoid loud multi-color gradients, neon glow effects, arbitrary drop shadows, or generic SaaS marketing cards.

## 2. Color Palette & Dark/Light Themes
### Dark Mode (Primary Visual Direction)
- Canvas Background: `bg-stone-950` (`#0c0a09`) / Card Surface: `bg-stone-900/60` (`#1c1917`)
- Foreground Text: Primary `text-stone-100` (`#f5f5f4`), Secondary `text-stone-400` (`#a8a29e`), Muted `text-stone-600` (`#57534e`)
- Accent / Warm Highlight: Amber Ochre `text-amber-400` (`#fbbf24`), `bg-amber-400/10`
- Subtle Borders: `border-stone-800/60`

### Light Mode (Editorial Canvas)
- Canvas Background: `bg-stone-50` (`#fafaf9`) / Card Surface: `bg-white/80`
- Foreground Text: Primary `text-stone-900` (`#1c1917`), Secondary `text-stone-600` (`#57534e`)
- Accent: Warm Ochre `text-amber-600` (`#d97706`)
- Borders: `border-stone-200/80`

## 3. Typography & Hierarchy
- **Display Headlines**: Serif or stark Editorial Display (`font-serif` or `font-sans` with `tracking-tight` / `leading-[0.92]`).
- **Technical Tags & Eyebrows**: Monospace metadata (`font-mono text-xs uppercase tracking-widest text-amber-400`). Numbered markers: `01 //`, `02 //`, `03 //`.
- **Body & Captions**: Clean sans-serif with high line-height (`leading-relaxed font-light`).

## 4. Tactile Micro-Interactions
- Pill-shaped action buttons (`rounded-full px-8 py-4`).
- Magnetic hover scaling (`transition-transform duration-300 hover:scale-105 active:scale-95`).
- Subtle card border shifts (`border-stone-800/80 hover:border-amber-400/40`).
