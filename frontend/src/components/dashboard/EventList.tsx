import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';
import { Event, User } from '../../model/models';

interface EventListProps {
  events: Event[];
}

const EventRow = ({ event, user }: { event: Event, user: User | null }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.eventCard}>
      <View style={styles.timeContainer}>
        <Text style={styles.time}>{formatTime(event.startTime)}</Text>
        <Text style={styles.date}>{formatDate(event.startTime)}</Text>
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <View style={styles.detailsRow}>
          <Text style={styles.eventTime}>
            {formatTime(event.startTime)} - {formatTime(event.endTime)}
          </Text>
          {user && (
            <View style={styles.userBadge}>
              <Text style={styles.userBadgeText}>{user.name}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const EnhancedEventRow = withObservables(['event'], ({ event }: { event: Event }) => ({
  event: event.observe(),
  user: event.user.observe(),
}))(EventRow);

export function EventList({ events }: EventListProps) {
  if (events.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Today&apos;s Events</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No events scheduled for today</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Today&apos;s Events</Text>
      <FlatList
        data={events}
        renderItem={({ item }) => <EnhancedEventRow event={item} />}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  eventCard: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timeContainer: {
    width: 70,
    marginRight: 12,
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
  },
  userBadge: {
    backgroundColor: '#E1E1E1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  userBadgeText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
