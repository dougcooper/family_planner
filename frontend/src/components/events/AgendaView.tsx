import React, { useMemo } from 'react';
import { View, Text, SectionList, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import { Event, User } from '../../model/models';
import { EventItem } from './EventItem';

interface AgendaViewProps {
  events: Event[];
  users: User[];
  currentDate: Date;
  onEventPress: (event: Event) => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  events,
  users,
  currentDate: _currentDate,
  onEventPress,
}) => {
  const sections = useMemo(() => {
    // 1. Sort events by start time
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // 2. Group by date
    const grouped: { [key: string]: Event[] } = {};
    sortedEvents.forEach(event => {
      const dateKey = dayjs(event.startTime).format('YYYY-MM-DD');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    // 3. Convert to SectionList format
    return Object.keys(grouped).map(dateKey => ({
      title: dayjs(dateKey).format('dddd, MMMM D, YYYY'),
      data: grouped[dateKey],
    }));
  }, [events]);

  const getUserColor = (userId?: string) => {
    if (!userId) return '#2196F3';
    
    const user = users.find(u => u.id === userId);
    if (user?.color) return user.color;

    const USER_COLORS = [
      '#EF5350', '#EC407A', '#AB47BC', '#7E57C2', '#5C6BC0',
      '#42A5F5', '#29B6F6', '#26C6DA', '#26A69A', '#66BB6A',
      '#9CCC65', '#D4E157', '#FFEE58', '#FFCA28', '#FFA726',
      '#FF7043', '#8D6E63', '#BDBDBD', '#78909C'
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % USER_COLORS.length;
    return USER_COLORS[index];
  };

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <EventItem 
              event={item} 
              color={getUserColor(item.userId)}
              isAllDay={item.isAllDay}
              onPress={() => onEventPress(item)}
            />
          </View>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.header}>
            <Text style={styles.headerText}>{title}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No upcoming events</Text>
          </View>
        }
        stickySectionHeadersEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  itemContainer: {
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  header: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});
