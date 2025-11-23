import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Event } from '../../model/models';

interface EventListProps {
  events: Event[];
}

export function EventList({ events }: EventListProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <View style={styles.eventCard}>
      <View style={styles.timeContainer}>
        <Text style={styles.time}>{formatTime(item.startTime)}</Text>
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventTime}>
          {formatTime(item.startTime)} - {formatTime(item.endTime)}
        </Text>
      </View>
    </View>
  );

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
        renderItem={renderEvent}
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
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
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
