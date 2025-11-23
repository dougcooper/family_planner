import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';
import { database } from '../src/model/database';
import { Event } from '../src/model/models';
import { DashboardLayout } from '../src/components/dashboard/DashboardLayout';
import { CreateEventModal } from '../src/components/events/CreateEventModal';
import { EditEventModal } from '../src/components/events/EditEventModal';
import { authProvider } from '../src/logic/auth';

interface EventsScreenProps {
  events: Event[];
}

const EventsScreen = ({ events }: EventsScreenProps) => {
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [currentUser, setCurrentUser] = useState(authProvider.getState().user);

  useEffect(() => {
    const unsubscribe = authProvider.subscribe((state) => {
      setCurrentUser(state.user);
    });
    return unsubscribe;
  }, []);

  const renderItem = ({ item }: { item: Event }) => (
    <TouchableOpacity onPress={() => setSelectedEvent(item)}>
      <View style={styles.eventItem}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventTime}>
          {item.startTime.toLocaleString()} - {item.endTime.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <DashboardLayout>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Events</Text>
          {currentUser?.role === 'PARENT' && (
            <TouchableOpacity onPress={() => setIsCreateModalVisible(true)} style={styles.addButton}>
              <Text style={styles.addButtonText}>+ New Event</Text>
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={events}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No events scheduled</Text>
            </View>
          }
        />
        {currentUser && (
          <>
            <CreateEventModal
              visible={isCreateModalVisible}
              onClose={() => setIsCreateModalVisible(false)}
              database={database}
              familyId={currentUser.familyId}
            />
            <EditEventModal
              visible={!!selectedEvent}
              onClose={() => setSelectedEvent(null)}
              database={database}
              event={selectedEvent}
            />
          </>
        )}
      </View>
    </DashboardLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  addButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  listContent: {
    padding: 16,
  },
  eventItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 15,
    color: '#8E8E93',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 17,
    color: '#8E8E93',
  },
});

const enhance = withObservables([], () => ({
  events: database.get<Event>('events').query(),
}));

export default enhance(EventsScreen);
