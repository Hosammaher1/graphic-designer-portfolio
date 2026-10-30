import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BuilderCanvas } from '../src/page-builder/BuilderCanvas.jsx';

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

const initialMockBlocks = [
  {
    id: 'blk-1',
    type: 'heading',
    version: 1,
    data: {
      text: 'Original Heading Text',
      level: 'h2',
    },
  },
  {
    id: 'blk-2',
    type: 'text',
    version: 1,
    data: {
      body: 'Original paragraph content',
    },
  },
];

describe('Page Builder UI Canvas (Task 05.04)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders builder canvas with initial block items and controls', () => {
    renderWithRouter(
      <BuilderCanvas
        pageId="test-page"
        initialBlocks={initialMockBlocks}
        locale="ar"
      />
    );

    expect(screen.getByRole('heading', { name: /محرر الصفحات والمرئيات/i })).toBeInTheDocument();
    expect(screen.getAllByText('Original Heading Text').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Original paragraph content').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /إضافة كتلة/i })).toBeInTheDocument();
  });

  it('adds a new block from the block library palette', () => {
    renderWithRouter(
      <BuilderCanvas
        pageId="test-page"
        initialBlocks={initialMockBlocks}
        locale="ar"
      />
    );

    // Open block library
    const addBtn = screen.getByRole('button', { name: /إضافة كتلة/i });
    fireEvent.click(addBtn);

    // Click "شريط دعوة (CTA)"
    const addCtaBtn = screen.getByRole('button', { name: /شريط دعوة \(CTA\)/i });
    fireEvent.click(addCtaBtn);

    // New CTA block should appear in canvas
    expect(screen.getAllByText(/دعنا نتعاون في مشروعك القادم/i).length).toBeGreaterThanOrEqual(1);
  });

  it('selects a block and updates properties in real-time', () => {
    renderWithRouter(
      <BuilderCanvas
        pageId="test-page"
        initialBlocks={initialMockBlocks}
        locale="ar"
      />
    );

    // Click block 1 to select
    const selectBtn = screen.getByRole('button', { name: /تعديل الكتلة: Original Heading Text/i });
    fireEvent.click(selectBtn);

    // Property inspector input should show current value
    const textInput = screen.getByLabelText(/نص العنوان/i);
    expect(textInput).toHaveValue('Original Heading Text');

    // Update value
    fireEvent.change(textInput, { target: { value: 'Updated Live Heading' } });

    // Live preview and outline must reflect updated text
    expect(screen.getAllByText('Updated Live Heading').length).toBeGreaterThanOrEqual(1);
  });

  it('reorders blocks using accessible Move Up and Move Down buttons', () => {
    renderWithRouter(
      <BuilderCanvas
        pageId="test-page"
        initialBlocks={initialMockBlocks}
        locale="ar"
      />
    );

    // Move first block down
    const moveDownBtn = screen.getByRole('button', { name: /تحريك الكتلة للأسفل 1/i });
    fireEvent.click(moveDownBtn);

    // The order of block cards in the canvas list should now place Paragraph before Heading
    const blockItems = screen.getAllByTestId('canvas-block-item');
    expect(within(blockItems[0]).getByText('Original paragraph content')).toBeInTheDocument();
    expect(within(blockItems[1]).getByText('Original Heading Text')).toBeInTheDocument();
  });

  it('duplicates a block creating a clone with a new unique ID', () => {
    renderWithRouter(
      <BuilderCanvas
        pageId="test-page"
        initialBlocks={initialMockBlocks}
        locale="ar"
      />
    );

    const dupBtn = screen.getByRole('button', { name: /تكرار الكتلة 1/i });
    fireEvent.click(dupBtn);

    // 2 in outline + 2 in preview = 4 elements
    const headingItems = screen.getAllByText('Original Heading Text');
    expect(headingItems.length).toBe(4);
  });

  it('removes a block from the canvas', () => {
    renderWithRouter(
      <BuilderCanvas
        pageId="test-page"
        initialBlocks={initialMockBlocks}
        locale="ar"
      />
    );

    const deleteBtn = screen.getByRole('button', { name: /حذف الكتلة 1/i });
    fireEvent.click(deleteBtn);

    expect(screen.queryByText('Original Heading Text')).not.toBeInTheDocument();
    expect(screen.getAllByText('Original paragraph content').length).toBeGreaterThanOrEqual(1);
  });

  it('cancels unsaved modifications and reverts to initial document state', () => {
    renderWithRouter(
      <BuilderCanvas
        pageId="test-page"
        initialBlocks={initialMockBlocks}
        locale="ar"
      />
    );

    // Select block and modify text
    const selectBtn = screen.getByRole('button', { name: /تعديل الكتلة: Original Heading Text/i });
    fireEvent.click(selectBtn);

    const textInput = screen.getByLabelText(/نص العنوان/i);
    fireEvent.change(textInput, { target: { value: 'Unsaved Scratch Text' } });
    expect(screen.getAllByText('Unsaved Scratch Text').length).toBeGreaterThanOrEqual(1);

    // Click Cancel / Revert button
    const cancelBtn = screen.getByRole('button', { name: /إلغاء التعديلات/i });
    fireEvent.click(cancelBtn);

    // Reverted back
    expect(screen.queryByText('Unsaved Scratch Text')).not.toBeInTheDocument();
    expect(screen.getAllByText('Original Heading Text').length).toBeGreaterThanOrEqual(1);
  });

  it('recovers unsaved draft from localStorage if present', () => {
    const recoveredBlocks = [
      {
        id: 'recovered-1',
        type: 'heading',
        version: 1,
        data: { text: 'Recovered Draft Heading', level: 'h1' },
      },
    ];

    localStorage.setItem('page-builder-recovery-test-page', JSON.stringify(recoveredBlocks));

    renderWithRouter(
      <BuilderCanvas
        pageId="test-page"
        initialBlocks={initialMockBlocks}
        locale="ar"
      />
    );

    // Should detect recovery draft and display banner
    expect(screen.getByText(/تم العثور على مسودة غير محفوظة/i)).toBeInTheDocument();

    // Click "استعادة المسودة"
    const restoreBtn = screen.getByRole('button', { name: /استعادة المسودة/i });
    fireEvent.click(restoreBtn);

    expect(screen.getAllByText('Recovered Draft Heading').length).toBeGreaterThanOrEqual(1);
  });
});
