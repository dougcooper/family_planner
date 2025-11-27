import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';
import { database } from '../src/model/database';
import { Event, User } from '../src/model/models';
import { DashboardLayout } from '../src/components/dashboard/DashboardLayout';
import { CreateEventModal } from '../src/components/events/CreateEventModal';
import { EditEventModal } from '../src/components/events/EditEventModal';
import { FamilyAssignmentSummary } from '../src/components/common/FamilyAssignmentSummary';
import { CalendarView } from '../src/components/events/CalendarView';
import { authProvider } from '../src/logic/auth';

interface EventsScreenProps {
  events: Event[];
  users: User[];
}

const EventsScreen = ({ events, users }: EventsScreenProps) => {
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [currentUser, setCurrentUser] = useState(authProvider.getState().user);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [initialDate, setInitialDate] = useState<Date | undefined>(undefined);

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

  const handleEmptySlotPress = (date: Date) => {
    setInitialDate(date);
    setIsCreateModalVisible(true);
  };

  return (
    <DashboardLayout>
      <View style={styles.container}>
        <View style={styles.sidebar}>
          <Text style={styles.pageTitle}>Events</Text>
          <FamilyAssignmentSummary
            users={users}
            counts={eventCounts}
            title="Assignments"
            selectedUserIds={Array.from(selectedUserIds)}
            onUserPress={handleUserPress}
            vertical={true}
          />
          {currentUser?.role === 'PARENT' && (
            <TouchableOpacity 
              onPress={() => {
                setInitialDate(undefined);
                setIsCreateModalVisible(true);
              }} 
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>+ New Event</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.calendarWrapper}>
          <CalendarView
            events={filteredEvents}
            users={users}
            onEventPress={setSelectedEvent}
            onEmptySlotPress={handleEmptySlotPress}
          />
        </View>
        
        {currentUser && (
          <>
            <CreateEventModal
              visible={isCreateModalVisible}
              onClose={() => setIsCreateModalVisible(false)}
              database={database}
              familyId={currentUser.familyId}
              initialDate={initialDate}
            />
            {selectedEvent && (
              <EditEventModal
                visible={!!selectedEvent}
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
                database={database}
              />
            )}
          </>
        )}
      </View>
    </DashboardLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 300,
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  calendarWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

const enhance = withObservables([], () => ({
  events: database.get<Event>('events').query(),
  users: database.collections.get<User>('users').query(),
}));

export default enhance(EventsScreen);
