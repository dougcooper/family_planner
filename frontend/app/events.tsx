import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';
import { X, Plus } from 'lucide-react-native';
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
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

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

  const handleEventUpdate = async (event: Event, start: Date, end: Date) => {
    try {
      await database.write(async () => {
        await event.update(e => {
          e.startTime = start;
          e.endTime = end;
        });
      });
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  return (
    <DashboardLayout scrollable={false}>
      <View style={styles.container}>
        {isSidebarOpen && (
          <View style={[styles.sidebar, isMobile && styles.sidebarMobile]}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.pageTitle}>Events</Text>
              {isMobile && (
                <TouchableOpacity onPress={() => setIsSidebarOpen(false)}>
                  <X size={24} color="#333" />
                </TouchableOpacity>
              )}
            </View>
            <FamilyAssignmentSummary
              users={users}
              counts={eventCounts}
              title="Assignments"
              selectedUserIds={Array.from(selectedUserIds)}
              onUserPress={handleUserPress}
              vertical={true}
            />
            {currentUser?.role === 'PARENT' && !isMobile && (
              <TouchableOpacity 
                onPress={() => {
                  setInitialDate(undefined);
                  setIsCreateModalVisible(true);
                  if (isMobile) setIsSidebarOpen(false);
                }} 
                style={styles.addButton}
              >
                <Text style={styles.addButtonText}>+ New Event</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        <View style={styles.calendarWrapper}>
          <CalendarView
            events={filteredEvents}
            users={users}
            onEventPress={setSelectedEvent}
            onEmptySlotPress={handleEmptySlotPress}
            onEventUpdate={handleEventUpdate}
            onMenuPress={isMobile ? () => setIsSidebarOpen(!isSidebarOpen) : undefined}
          />
        </View>
        
        {isMobile && currentUser?.role === 'PARENT' && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => {
              setInitialDate(undefined);
              setIsCreateModalVisible(true);
            }}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}

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
    position: 'relative',
  },
  sidebar: {
    width: 300,
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    zIndex: 10,
  },
  sidebarMobile: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '80%',
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  calendarWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 100,
  },
});

const enhance = withObservables([], () => ({
  events: database.get<Event>('events').query(),
  users: database.collections.get<User>('users').query(),
}));

export default enhance(EventsScreen);
