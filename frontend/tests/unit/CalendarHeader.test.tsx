import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CalendarHeader } from '../../src/components/events/CalendarHeader';

describe('CalendarHeader', () => {
  const mockDate = new Date('2023-10-15T12:00:00');
  const mockOnViewChange = jest.fn();
  const mockOnPrev = jest.fn();
  const mockOnNext = jest.fn();
  const mockOnToday = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the current date correctly', () => {
    const { getByText } = render(
      <CalendarHeader
        currentDate={mockDate}
        viewMode="month"
        onViewChange={mockOnViewChange}
        onPrev={mockOnPrev}
        onNext={mockOnNext}
        onToday={mockOnToday}
      />
    );

    expect(getByText('October 2023')).toBeTruthy();
  });

  it('calls navigation handlers when buttons are pressed', () => {
    const { getByText, getByTestId } = render(
      <CalendarHeader
        currentDate={mockDate}
        viewMode="month"
        onViewChange={mockOnViewChange}
        onPrev={mockOnPrev}
        onNext={mockOnNext}
        onToday={mockOnToday}
      />
    );

    fireEvent.press(getByTestId('prev-button'));
    expect(mockOnPrev).toHaveBeenCalled();

    fireEvent.press(getByTestId('next-button'));
    expect(mockOnNext).toHaveBeenCalled();

    fireEvent.press(getByText('Today'));
    expect(mockOnToday).toHaveBeenCalled();
  });

  it('calls onViewChange when view options are pressed', () => {
    const { getByText } = render(
      <CalendarHeader
        currentDate={mockDate}
        viewMode="month"
        onViewChange={mockOnViewChange}
        onPrev={mockOnPrev}
        onNext={mockOnNext}
        onToday={mockOnToday}
      />
    );

    fireEvent.press(getByText('Week'));
    expect(mockOnViewChange).toHaveBeenCalledWith('week');

    fireEvent.press(getByText('Day'));
    expect(mockOnViewChange).toHaveBeenCalledWith('day');

    fireEvent.press(getByText('Agenda'));
    expect(mockOnViewChange).toHaveBeenCalledWith('agenda');
  });
});
