import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Textarea,
  Select,
  Badge,
  Container,
  Grid,
  Flex,
  Stack,
  SkipToContent,
} from '../src/components/ui';

describe('Design System UI Primitives', () => {
  describe('Button', () => {
    it('renders button with label and default primary variant', () => {
      render(<Button>Click Me</Button>);
      const btn = screen.getByRole('button', { name: 'Click Me' });
      expect(btn).toBeInTheDocument();
      expect(btn.className).toContain('btn');
      expect(btn.className).toContain('btn-primary');
      expect(btn.className).toContain('btn-md');
    });

    it('renders different variants and sizes', () => {
      const { rerender } = render(<Button variant="outline" size="sm">Small Outline</Button>);
      let btn = screen.getByRole('button', { name: 'Small Outline' });
      expect(btn.className).toContain('btn-outline');
      expect(btn.className).toContain('btn-sm');

      rerender(<Button variant="danger" size="lg">Large Danger</Button>);
      btn = screen.getByRole('button', { name: 'Large Danger' });
      expect(btn.className).toContain('btn-danger');
      expect(btn.className).toContain('btn-lg');
    });

    it('handles click events when enabled', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Submit</Button>);
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disables button and prevents click when disabled', () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      const btn = screen.getByRole('button', { name: 'Disabled' });
      expect(btn).toBeDisabled();
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('sets aria-busy and disables interaction when loading', () => {
      const handleClick = vi.fn();
      render(<Button loading onClick={handleClick}>Processing</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toHaveAttribute('aria-busy', 'true');
      expect(btn).toBeDisabled();
      expect(screen.getByText('Processing')).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('renders as anchor when href or as="a" is supplied', () => {
      render(
        <Button as="a" href="/projects" variant="secondary">
          View Projects
        </Button>
      );
      const link = screen.getByRole('link', { name: 'View Projects' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/projects');
      expect(link.className).toContain('btn-secondary');
    });
  });

  describe('Card', () => {
    it('renders Card with compound components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Project Card</CardTitle>
            <CardDescription>Visual identity description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Body content goes here</p>
          </CardContent>
          <CardFooter>
            <Button size="sm">Explore</Button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText('Project Card')).toBeInTheDocument();
      expect(screen.getByText('Visual identity description')).toBeInTheDocument();
      expect(screen.getByText('Body content goes here')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Explore' })).toBeInTheDocument();
    });

    it('applies interactive hover class when interactive={true}', () => {
      const { container } = render(<Card interactive>Hoverable</Card>);
      expect(container.firstChild.className).toContain('card-interactive');
    });
  });

  describe('Input', () => {
    it('associates label with input using htmlFor and id', () => {
      render(<Input id="user-email" label="Email Address" />);
      const input = screen.getByLabelText('Email Address');
      expect(input).toBeInTheDocument();
      expect(input.id).toBe('user-email');
    });

    it('renders required indicator when required={true}', () => {
      render(<Input id="username" label="Username" required />);
      const input = screen.getByLabelText(/Username/);
      expect(input).toBeRequired();
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('renders helper text linked with aria-describedby', () => {
      render(<Input id="field" label="Field" hint="Enter at least 3 characters" />);
      const input = screen.getByLabelText('Field');
      expect(input).toHaveAttribute('aria-describedby', 'field-hint');
      expect(screen.getByText('Enter at least 3 characters')).toHaveAttribute('id', 'field-hint');
    });

    it('renders error message, sets aria-invalid, and links aria-describedby', () => {
      render(<Input id="email" label="Email" error="Invalid email address" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'email-error');
      expect(screen.getByText('Invalid email address')).toHaveAttribute('id', 'email-error');
    });
  });

  describe('Textarea', () => {
    it('renders labeled textarea with rows and accessible error state', () => {
      render(
        <Textarea
          id="message"
          label="Your Message"
          rows={5}
          error="Message cannot be blank"
        />
      );
      const textarea = screen.getByLabelText('Your Message');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('rows', '5');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
      expect(textarea).toHaveAttribute('aria-describedby', 'message-error');
      expect(screen.getByText('Message cannot be blank')).toBeInTheDocument();
    });
  });

  describe('Select', () => {
    it('renders labeled select with options and handles value change', () => {
      const handleChange = vi.fn();
      render(
        <Select id="category" label="Category" onChange={handleChange}>
          <option value="branding">Branding</option>
          <option value="packaging">Packaging</option>
        </Select>
      );
      const select = screen.getByLabelText('Category');
      expect(select).toBeInTheDocument();
      fireEvent.change(select, { target: { value: 'packaging' } });
      expect(handleChange).toHaveBeenCalled();
    });

    it('marks aria-invalid when select has an error', () => {
      render(
        <Select id="tool" label="Tool" error="Please choose a tool">
          <option value="">Select...</option>
        </Select>
      );
      const select = screen.getByLabelText('Tool');
      expect(select).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('Please choose a tool')).toBeInTheDocument();
    });
  });

  describe('Badge', () => {
    it('renders badge with variants and sizes', () => {
      const { rerender } = render(<Badge variant="success">Published</Badge>);
      let badge = screen.getByText('Published');
      expect(badge.className).toContain('badge');
      expect(badge.className).toContain('badge-success');

      rerender(<Badge variant="warning" size="sm">Draft</Badge>);
      badge = screen.getByText('Draft');
      expect(badge.className).toContain('badge-warning');
      expect(badge.className).toContain('badge-sm');
    });
  });

  describe('Container', () => {
    it('applies container classes for different sizes', () => {
      const { rerender, container } = render(<Container size="site">Content</Container>);
      expect(container.firstChild.className).toContain('container-site');

      rerender(<Container size="content">Content</Container>);
      expect(container.firstChild.className).toContain('container-content');

      rerender(<Container size="narrow">Content</Container>);
      expect(container.firstChild.className).toContain('container-narrow');
    });
  });

  describe('Grid', () => {
    it('applies column and gap classes', () => {
      const { container } = render(<Grid cols={3} gap="lg">Items</Grid>);
      expect(container.firstChild.className).toContain('grid-cols-3');
      expect(container.firstChild.className).toContain('gap-lg');
    });
  });

  describe('Flex and Stack', () => {
    it('Flex applies direction, align, and justify classes', () => {
      const { container } = render(
        <Flex direction="row" align="center" justify="between" gap="md">
          <span>A</span>
          <span>B</span>
        </Flex>
      );
      expect(container.firstChild.className).toContain('flex-row');
      expect(container.firstChild.className).toContain('items-center');
      expect(container.firstChild.className).toContain('justify-between');
      expect(container.firstChild.className).toContain('gap-md');
    });

    it('Stack renders vertical column flex', () => {
      const { container } = render(<Stack gap="sm"><span>1</span><span>2</span></Stack>);
      expect(container.firstChild.className).toContain('flex-column');
      expect(container.firstChild.className).toContain('gap-sm');
    });
  });

  describe('SkipToContent', () => {
    it('renders accessible skip link with href targeting main-content', () => {
      render(<SkipToContent targetId="main-content">Skip to content</SkipToContent>);
      const link = screen.getByRole('link', { name: 'Skip to content' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '#main-content');
      expect(link.className).toContain('skip-link');
    });
  });
});
