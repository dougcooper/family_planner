import React, { useState, useMemo, useRef, useEffect } from 'react';
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
}) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const kitEvents = useMemo(() => {
    return events.map(event => {
      const isAllDay = event.isAllDay;
      const start = isAllDay 
        ? { date: dayjs(event.startTime).format('YYYY-MM-DD') }
        : { dateTime: event.startTime.toISOString() };
      const end = isAllDay
        ? { date: dayjs(event.endTime).format('YYYY-MM-DD') }
        : { dateTime: event.endTime.toISOString() };

      const color = userColorMap[event.userId || ''] || '#ccc';

      return {
        id: event.id,
        start,
        end,
        title: event.title,
        color,
        userColor: color,
        resourceId: event.userId,
      };
    });
  }, [events, userColorMap]);

  const resources = useMemo(() => {
    return users.map(user => ({
      id: user.id,
      title: user.name,
      color: user.color || userColorMap[user.id],
    }));
  }, [users, userColorMap]);

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
      case 'resource':
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
      case 'resource':
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

  const handleDragEventEnd = (_event: OnEventResponse) => {
    // TODO: Implement event update logic
    // console.log('Event dragged:', event);
    
    // Construct updated event object
    // const updatedEvent = {
    //   id: event.id,
    //   startTime: new Date(event.start.dateTime || event.start.date),
    //   endTime: new Date(event.end.dateTime || event.end.date),
    //   resourceId: event.resourceId,
    // };
    
    // We would call a prop here to update the event
    // onUpdateEvent(updatedEvent);
  };

  const getUserColor = (userId?: string) => {
    if (!userId) return '#2196F3';
    if (userColorMap[userId]) return userColorMap[userId];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % USER_COLORS.length;
    return USER_COLORS[index];
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
    if (viewMode === 'day' || viewMode === 'week' || viewMode === 'resource') {
      return (
        <TimelineCalendar
          key={viewMode}
          ref={calendarRef}
          events={kitEvents}
          resources={viewMode === 'resource' ? resources : undefined}
          allowDragToCreate
          allowDragToEdit
          onDragCreateEventEnd={handleDragCreateEnd}
          onPressEvent={handlePressEvent}
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
        height={Dimensions.get('window').height - 100}
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
      />
      <View style={styles.legendContainer}>
        {users.map(user => (
          <View key={user.id} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: getUserColor(user.id) }]} />
            <Text style={styles.legendText}>{user.name}</Text>
          </View>
        ))}
      </View>
      <View style={styles.calendarContainer}>
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
