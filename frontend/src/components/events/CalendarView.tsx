import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { Calendar } from 'react-native-big-calendar';
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
