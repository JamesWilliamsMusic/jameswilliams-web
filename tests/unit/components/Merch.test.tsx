/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Merch from '@/components/Merch';
import type { MerchItem } from '@/lib/webiny/types';

// Mock IntersectionObserver
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();

beforeAll(() => {
  (global as unknown as Record<string, unknown>).IntersectionObserver = jest.fn((callback) => {
    setTimeout(() => callback([{ isIntersecting: true }]), 0);
    return { observe: mockObserve, disconnect: mockDisconnect, unobserve: jest.fn() };
  });
});

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock feature flags
jest.mock('@/lib/feature-flags', () => ({
  featureFlags: { merch: true, auth: false },
}));

const items: MerchItem[] = [
  { id: 'm-1', title: 'Tour T-Shirt', price: 35, image: 'https://img.test/shirt.jpg', shopUrl: 'https://shop.test/shirt' },
  { id: 'm-2', title: 'Vinyl Record', price: 45, image: null, shopUrl: 'https://shop.test/vinyl' },
];

describe('Merch', () => {
  it('renders merch items when flag is enabled and items exist', () => {
    render(<Merch items={items} />);

    expect(screen.getAllByText('Tour T-Shirt').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Vinyl Record').length).toBeGreaterThan(0);
  });

  it('renders item prices', () => {
    render(<Merch items={items} />);

    expect(screen.getByText('$35')).toBeInTheDocument();
    expect(screen.getByText('$45')).toBeInTheDocument();
  });

  it('renders shop links', () => {
    render(<Merch items={items} />);

    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', 'https://shop.test/shirt');
  });

  it('renders image for items with image', () => {
    render(<Merch items={items} />);

    const img = screen.getByRole('img', { name: 'Tour T-Shirt' });
    expect(img).toHaveAttribute('src', 'https://img.test/shirt.jpg');
  });

  it('shows Coming Soon when no items provided', () => {
    render(<Merch items={[]} />);

    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
  });

  it('shows Coming Soon when merch flag is disabled', () => {
    // Temporarily override flag
    jest.resetModules();
    jest.doMock('@/lib/feature-flags', () => ({
      featureFlags: { merch: false, auth: false },
    }));

    // Re-render — need fresh import
    const MerchFresh = require('@/components/Merch').default;
    const { container } = render(<MerchFresh items={items} />);

    expect(container.textContent).toContain('Coming Soon');
  });
});
