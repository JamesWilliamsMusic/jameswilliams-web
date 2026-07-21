/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TourDates from '@/components/TourDates';
import type { TourDate } from '@/lib/webiny/types';

// Mock IntersectionObserver
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();

beforeAll(() => {
  (global as unknown as Record<string, unknown>).IntersectionObserver = jest.fn((callback) => {
    // Immediately trigger as visible
    setTimeout(() => callback([{ isIntersecting: true }]), 0);
    return { observe: mockObserve, disconnect: mockDisconnect, unobserve: jest.fn() };
  });
});

const futureDateStr = '2027-06-15';
const pastDateStr = '2020-01-01';

const upcomingDates: TourDate[] = [
  { id: 'td-1', date: futureDateStr, city: 'Sydney', state: 'NSW', venue: 'Opera House', status: 'available', rsvpUrl: 'https://rsvp.test' },
  { id: 'td-2', date: futureDateStr, city: 'Melbourne', state: 'VIC', venue: 'Rod Laver', status: 'sold_out' },
  { id: 'td-3', date: futureDateStr, city: 'Brisbane', state: 'QLD', venue: 'Riverstage', status: 'few_left', rsvpUrl: 'https://rsvp2.test' },
];

const pastDates: TourDate[] = [
  { id: 'td-past', date: pastDateStr, city: 'Perth', state: 'WA', venue: 'RAC Arena', status: 'available', rsvpUrl: '#' },
];

describe('TourDates', () => {
  it('renders upcoming tour dates', () => {
    render(<TourDates dates={upcomingDates} />);

    expect(screen.getByText('Sydney, NSW')).toBeInTheDocument();
    expect(screen.getByText('Opera House')).toBeInTheDocument();
    expect(screen.getByText('Melbourne, VIC')).toBeInTheDocument();
  });

  it('shows RSVP links for available dates', () => {
    render(<TourDates dates={upcomingDates} />);

    const rsvpLinks = screen.getAllByText('RSVP');
    expect(rsvpLinks.length).toBeGreaterThan(0);
    expect(rsvpLinks[0].closest('a')).toHaveAttribute('href', 'https://rsvp.test');
  });

  it('shows Sold Out for sold out dates', () => {
    render(<TourDates dates={upcomingDates} />);

    expect(screen.getByText('Sold Out')).toBeInTheDocument();
  });

  it('shows message when no upcoming dates exist', () => {
    render(<TourDates dates={pastDates} />);

    expect(screen.getByText(/no upcoming shows/i)).toBeInTheDocument();
  });

  it('shows past dates toggle when past dates exist', () => {
    render(<TourDates dates={[...upcomingDates, ...pastDates]} />);

    const toggleButton = screen.getByRole('button', { name: /past shows/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('toggles past dates visibility on click', () => {
    render(<TourDates dates={[...upcomingDates, ...pastDates]} />);

    // Past dates should not be visible initially
    expect(screen.queryByText('Perth, WA')).not.toBeInTheDocument();

    // Click to show past dates
    const toggleButton = screen.getByRole('button', { name: /past shows/i });
    fireEvent.click(toggleButton);

    expect(screen.getByText('Perth, WA')).toBeInTheDocument();
    expect(screen.getByText('Past')).toBeInTheDocument();

    // Click again to hide
    fireEvent.click(toggleButton);
    expect(screen.queryByText('Perth, WA')).not.toBeInTheDocument();
  });

  it('does not show past dates section when none exist', () => {
    render(<TourDates dates={upcomingDates} />);

    expect(screen.queryByRole('button', { name: /past shows/i })).not.toBeInTheDocument();
  });
});
