import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CalendarView } from '../../src/components/events/CalendarView';
import { Event, User } from '../../src/model/models';
import dayjs from 'dayjs';

// Mock dependencies
/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('react-native-big-calendar', () => {
  const { View, Text } = require('react-native');
  const dayjs = require('dayjs');
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Calendar: (props: any) => (
      <View testID="mock-big-calendar">
        <Text>{props.mode}</Text>
        <Text>{dayjs(props.date).format('YYYY-MM-DD')}</Text>
      </View>
    ),
  };
});

jest.mock('../../src/components/events/AgendaView', () => {
  const { View } = require('react-native');
  return {
    AgendaView: () => <View testID="mock-agenda-view" />
  };
});

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return {
    ChevronLeft: () => <Text>Left</Text>,
    ChevronRight: () => <Text>Right</Text>,
  };
});

jest.mock('@howljs/calendar-kit', () => {
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: (props: any) => (
      <View testID="mock-timeline-calendar">
        <Text>{props.viewMode || (props.numberOfDays === 7 ? 'week' : 'day')}</Text>
        <Text>{props.initialDate}</Text>
        {props.resources && <Text>Has Resources</Text>}
      </View>
    ),
  };
});
/* eslint-enable @typescript-eslint/no-require-imports */

describe('CalendarView', () => {
  const mockEvents: Event[] = [
    {
      id: '1',
      title: 'Test Event',
      startTime: new Date('2023-10-15T10:00:00'),
      endTime: new Date('2023-10-15T11:00:00'),
      userId: 'user1',
      isAllDay: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      familyId: 'family1',
    } as Event,
  ];
  const mockUsers: User[] = [];
  const mockOnEventPress = jest.fn();
  const mockOnEmptySlotPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset date to a fixed point if needed, but component initializes with new Date()
    // We might need to mock system time or just check relative changes
  });

  it('renders correctly in default month view', () => {
    const { getByTestId, getByText } = render(
      <CalendarView
        events={mockEvents}
        users={mockUsers}
        onEventPress={mockOnEventPress}
        onEmptySlotPress={mockOnEmptySlotPress}
      />
    );

    expect(getByTestId('mock-big-calendar')).toBeTruthy();
    expect(getByText('month')).toBeTruthy();
  });

  it('switches to agenda view', () => {
    const { getByText, getByTestId } = render(
      <CalendarView
        events={mockEvents}
        users={mockUsers}
        onEventPress={mockOnEventPress}
        onEmptySlotPress={mockOnEmptySlotPress}
      />
    );

    fireEvent.press(getByText('Agenda'));
    expect(getByTestId('mock-big-calendar')).toBeTruthy();
    expect(getByText('schedule')).toBeTruthy();
  });

  it('navigates to next month', () => {
    const { getByTestId, getByText } = render(
      <CalendarView
        events={mockEvents}
        users={mockUsers}
        onEventPress={mockOnEventPress}
        onEmptySlotPress={mockOnEmptySlotPress}
      />
    );

    // Get current date from the mock calendar render
    // Note: This is a bit tricky because we don't know the exact current date of the test runner
    // But we can check if the date changes.
    
    // Let's rely on the header date display
    const initialHeaderDate = dayjs().format('MMMM YYYY');
    expect(getByText(initialHeaderDate)).toBeTruthy();

    fireEvent.press(getByTestId('next-button'));

    const nextMonthDate = dayjs().add(1, 'month').format('MMMM YYYY');
    expect(getByText(nextMonthDate)).toBeTruthy();
  });

  it('navigates to previous month', () => {
    const { getByTestId, getByText } = render(
      <CalendarView
        events={mockEvents}
        users={mockUsers}
        onEventPress={mockOnEventPress}
        onEmptySlotPress={mockOnEmptySlotPress}
      />
    );

    fireEvent.press(getByTestId('prev-button'));

    const prevMonthDate = dayjs().subtract(1, 'month').format('MMMM YYYY');
    expect(getByText(prevMonthDate)).toBeTruthy();
  });

  it('switches to day view', () => {
    const { getByText, getByTestId } = render(
      <CalendarView
        events={mockEvents}
        users={mockUsers}
        onEventPress={mockOnEventPress}
        onEmptySlotPress={mockOnEmptySlotPress}
      />
    );

    fireEvent.press(getByText('Day'));
    expect(getByTestId('mock-timeline-calendar')).toBeTruthy();
    expect(getByText('day')).toBeTruthy();
  });

  it('switches to week view', () => {
    const { getByText, getByTestId } = render(
      <CalendarView
        events={mockEvents}
        users={mockUsers}
        onEventPress={mockOnEventPress}
        onEmptySlotPress={mockOnEmptySlotPress}
      />
    );

    fireEvent.press(getByText('Week'));
    expect(getByTestId('mock-timeline-calendar')).toBeTruthy();
    expect(getByText('week')).toBeTruthy();
  });

  it('switches to resource view', () => {
    const { getByText, getByTestId } = render(
      <CalendarView
        events={mockEvents}
        users={mockUsers}
        onEventPress={mockOnEventPress}
        onEmptySlotPress={mockOnEmptySlotPress}
      />
    );

    fireEvent.press(getByText('Resource'));
    expect(getByTestId('mock-timeline-calendar')).toBeTruthy();
    expect(getByText('Has Resources')).toBeTruthy();
  });
});
