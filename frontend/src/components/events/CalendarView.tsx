import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { Calendar } from 'react-native-big-calendar';
import TimelineCalendar, { PackedEvent, CalendarKitHandle, OnCreateEventResponse, OnEventResponse } from '@howljs/calendar-kit';
import dayjs from 'dayjs';
import { Event, User } from '../../model/models';
import { CalendarHeader, CalendarViewMode } from './CalendarHeader';
import { EventItem } from './EventItem';

interface CalendarViewProps {
  events: Event[];
  users: User[];
  onEventPress: (event: Event) => void;
  onEmptySlotPress: (date: Date) => void;
  onEventUpdate?: (event: Event, start: Date, end: Date) => void;
  onMenuPress?: () => void;
}

const USER_COLORS = [
  '#EF5350', '#EC407A', '#AB47BC', '#7E57C2', '#5C6BC0',
  '#42A5F5', '#29B6F6', '#26C6DA', '#26A69A', '#66BB6A',
  '#9CCC65', '#D4E157', '#FFEE58', '#FFCA28', '#FFA726',
  '#FF7043', '#8D6E63', '#BDBDBD', '#78909C'
];

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  users,
  onEventPress,
  onEmptySlotPress,
  onEventUpdate,
  onMenuPress,
}) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('agenda');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [containerHeight, setContainerHeight] = useState(0);

  const userColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach(u => {
      if (u.color) {
        map[u.id] = u.color;
      }
    });
    return map;
  }, [users]);

  const calendarEvents = useMemo(() => {
    return events.map(event => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);

      // Ensure all-day events are strictly set to start/end of day
      if (event.isAllDay) {
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
      }

      return {
        title: event.title,
        start,
        end,
        allDay: !!event.isAllDay, 
        originalEvent: event,
      };
    });
  }, [events]);

  const getUserColor = useCallback((userId?: string) => {
    if (!userId) return '#2196F3';
    if (userColorMap[userId]) return userColorMap[userId];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % USER_COLORS.length;
    return USER_COLORS[index];
  }, [userColorMap]);

  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, { start: any, end: any }>>({});
  const [prevEvents, setPrevEvents] = useState(events);

  if (events !== prevEvents) {
    setPrevEvents(events);
    setOptimisticUpdates({});
  }

  const kitEvents = useMemo(() => {
    return events.map(event => {
      const isAllDay = event.isAllDay;
      const resourceId = event.userId;
      
      let start, end;
      
      if (optimisticUpdates[event.id]) {
        start = optimisticUpdates[event.id].start;
        end = optimisticUpdates[event.id].end;
      } else {
        start = isAllDay 
          ? { date: dayjs(event.startTime).format('YYYY-MM-DD'), resourceId }
          : { dateTime: event.startTime.toISOString(), resourceId };
        end = isAllDay
          ? { date: dayjs(event.endTime).format('YYYY-MM-DD'), resourceId }
          : { dateTime: event.endTime.toISOString(), resourceId };
      }

      const color = getUserColor(event.userId);

      return {
        id: event.id,
        start,
        end,
        title: event.title,
        color,
        userColor: color,
        resourceId,
      };
    });
  }, [events, getUserColor, optimisticUpdates]);



  const handleViewChange = (mode: CalendarViewMode) => {
    setViewMode(mode);
  };

  const handlePrev = () => {
    const date = dayjs(currentDate);
    let newDate;
    switch (viewMode) {
      case 'month':
        newDate = date.subtract(1, 'month');
        break;
      case 'week':
        newDate = date.subtract(1, 'week');
        break;
      case 'day':
        newDate = date.subtract(1, 'day');
        break;
      default:
        newDate = date.subtract(1, 'month');
    }
    setCurrentDate(newDate.toDate());
  };

  const handleNext = () => {
    const date = dayjs(currentDate);
    let newDate;
    switch (viewMode) {
      case 'month':
        newDate = date.add(1, 'month');
        break;
      case 'week':
        newDate = date.add(1, 'week');
        break;
      case 'day':
        newDate = date.add(1, 'day');
        break;
      default:
        newDate = date.add(1, 'month');
    }
    setCurrentDate(newDate.toDate());
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
  };

  const handleCellPress = (date: Date) => {
    onEmptySlotPress(date);
  };

  const handleDragCreateEnd = (event: OnCreateEventResponse) => {
    const dateStr = event.start.dateTime || event.start.date;
    if (dateStr) {
      const date = new Date(dateStr);
      onEmptySlotPress(date);
    }
  };

  const handlePressEvent = (event: OnEventResponse) => {
    const original = events.find(e => e.id === event.id);
    if (original) {
      onEventPress(original);
    }
  };

  const handleDragEventEnd = (event: OnEventResponse) => {
    if (!onEventUpdate) return;

    const original = events.find(e => e.id === event.id);
    if (original) {
      const start = new Date(event.start.dateTime || event.start.date || '');
      const end = new Date(event.end.dateTime || event.end.date || '');
      
      // Optimistic update
      setOptimisticUpdates(prev => ({
        ...prev,
        [event.id]: { start: event.start, end: event.end }
      }));

      onEventUpdate(original, start, end);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBackgroundPress = (props: any, _event: any) => {
    const dateStr = props.dateTime || props.date;
    if (dateStr) {
      const date = new Date(dateStr);
      onEmptySlotPress(date);
    }
  };



  const calendarRef = useRef<CalendarKitHandle>(null);

  useEffect(() => {
    if (calendarRef.current) {
      // Use date string YYYY-MM-DD for goToDate if possible, or ISO string
      calendarRef.current.goToDate({ date: currentDate.toISOString() });
    }
  }, [currentDate]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderKitEvent = (event: PackedEvent, _size: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const color = (event as any).userColor || event.color || '#ccc';
    return (
      <View style={{ 
        width: '100%', 
        height: '100%', 
        backgroundColor: color,
        borderRadius: 4,
        padding: 2,
        overflow: 'hidden',
        borderLeftWidth: 3,
        borderLeftColor: 'rgba(0,0,0,0.2)'
      }}>
        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }} numberOfLines={1}>
          {event.title}
        </Text>
      </View>
    );
  };

  const renderCalendar = () => {
    if (viewMode === 'day' || viewMode === 'week') {
      return (
        <TimelineCalendar
          key={viewMode}
          ref={calendarRef}
          events={kitEvents}
          allowDragToCreate
          allowDragToEdit
          onDragCreateEventEnd={handleDragCreateEnd}
          onPressEvent={handlePressEvent}
          onPressBackground={handleBackgroundPress}
          renderEvent={renderKitEvent}
          numberOfDays={viewMode === 'week' ? 7 : 1}
          initialDate={currentDate.toISOString().split('T')[0]}
          onDragEventEnd={handleDragEventEnd}
        />
      );
    }

    return (
      <Calendar
        events={calendarEvents}
        height={containerHeight > 0 ? containerHeight : Dimensions.get('window').height - 100}
        mode={viewMode === 'agenda' ? 'schedule' : viewMode as 'month' | 'week' | 'day' | 'schedule' | '3days'}
        date={currentDate}
        onPressEvent={(event) => onEventPress(event.originalEvent)}
        onPressCell={handleCellPress}
        swipeEnabled={true}
        ampm={true}
        showAllDayEventCell={true}
        eventMinHeightForMonthView={18}
        maxVisibleEventCount={4}
        eventCellStyle={(_event) => {
          return { backgroundColor: 'transparent' }; // We handle background in EventItem
        }}
        renderEvent={(event, touchableOpacityProps) => {
           if (viewMode === 'month') {
             return (
               <View style={{ 
                 backgroundColor: getUserColor(event.originalEvent.userId),
                 borderRadius: 3,
                 paddingHorizontal: 4,
                 paddingVertical: 1,
                 marginVertical: 1,
                 width: '100%',
                 overflow: 'hidden'
               }}>
                 <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }} numberOfLines={1}>
                   {event.title}
                 </Text>
               </View>
             );
           }
           return (
             <EventItem 
               event={event.originalEvent} 
               color={getUserColor(event.originalEvent.userId)}
               onPress={() => onEventPress(event.originalEvent)}
               isAllDay={event.allDay}
               style={touchableOpacityProps.style}
             />
           );
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onViewChange={handleViewChange}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onMenuPress={onMenuPress}
      />
      <View style={styles.legendContainer}>
        {users.map(user => (
          <View key={user.id} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: getUserColor(user.id) }]} />
            <Text style={styles.legendText}>{user.name}</Text>
          </View>
        ))}
      </View>
      <View style={styles.calendarContainer} onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}>
        {renderCalendar()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  calendarContainer: {
    flex: 1,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});
