import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';
import { database } from '../src/model/database';
import { Event, User } from '../src/model/models';
import { DashboardLayout } from '../src/components/dashboard/DashboardLayout';
import { CreateEventModal } from '../src/components/events/CreateEventModal';
import { EditEventModal } from '../src/components/events/EditEventModal';
import { FamilyAssignmentSummary } from '../src/components/common/FamilyAssignmentSummary';
import { authProvider } from '../src/logic/auth';

interface EventsScreenProps {
  events: Event[];
  users: User[];
}

const EventListItem = ({ event, user, onPress }: { event: Event, user: User | null, onPress: (event: Event) => void }) => (
  <TouchableOpacity onPress={() => onPress(event)}>
    <View style={styles.eventItem}>
      <Text style={styles.eventTitle}>{event.title}</Text>
      <View style={styles.detailsRow}>
        <Text style={styles.eventTime}>
          {event.startTime.toLocaleString()} - {event.endTime.toLocaleString()}
        </Text>
        {user && (
          <View style={styles.userBadge}>
            <Text style={styles.userBadgeText}>{user.name}</Text>
          </View>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

const EnhancedEventListItem = withObservables(['event'], ({ event }: { event: Event }) => ({
  event: event.observe(),
  user: event.user.observe(),
}))(EventListItem);

const EventsScreen = ({ events, users }: EventsScreenProps) => {
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [currentUser, setCurrentUser] = useState(authProvider.getState().user);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = authProvider.subscribe((state) => {
      setCurrentUser(state.user);
    });
    return unsubscribe;
  }, []);

  const handleUserPress = (user: User) => {
    const userId = user.id;
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const eventCounts = events.reduce((acc, event) => {
    if (event.userId) {
      acc[event.userId] = (acc[event.userId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const filteredEvents = events.filter(event => {
    if (selectedUserIds.size === 0) return true;
    return event.userId && selectedUserIds.has(event.userId);
  });

  const renderItem = ({ item }: { item: Event }) => (
    <EnhancedEventListItem event={item} onPress={setSelectedEvent} />
  );

  return (
    <DashboardLayout>
      <View style={styles.container}>
        <FamilyAssignmentSummary
          users={users}
          counts={eventCounts}
          title="Event Assignments"
          selectedUserIds={Array.from(selectedUserIds)}
          onUserPress={handleUserPress}
        />
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Events</Text>
          {currentUser?.role === 'PARENT' && (
            <TouchableOpacity onPress={() => setIsCreateModalVisible(true)} style={styles.addButton}>
              <Text style={styles.addButtonText}>+ New Event</Text>
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={filteredEvents}
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
  eventItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  eventTime: {
    fontSize: 15,
    color: '#8E8E93',
  },
  userBadge: {
    backgroundColor: '#E1E1E1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  userBadgeText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
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
  users: database.collections.get<User>('users').query(),
}));

export default enhance(EventsScreen);
