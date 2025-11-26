import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView, Platform, Alert } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Database, Q } from '@nozbe/watermelondb';
import { Event, User } from '../../model/models';
import { updateEvent, deleteEvent, deleteRecurringEvent, buildRecurrenceRule, type RecurrenceOptions } from '../../logic/events';
import log from '../../utils/logger';

interface EditEventModalProps {
  visible: boolean;
  onClose: () => void;
  database: Database;
  event: Event | null;
}

type RecurrenceEndType = 'never' | 'on_date' | 'after_count';
type FrequencyType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
type DayOfWeek = 'SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA';

const DAYS_OF_WEEK: { key: DayOfWeek; label: string }[] = [
  { key: 'SU', label: 'Su' },
  { key: 'MO', label: 'Mo' },
  { key: 'TU', label: 'Tu' },
  { key: 'WE', label: 'We' },
  { key: 'TH', label: 'Th' },
  { key: 'FR', label: 'Fr' },
  { key: 'SA', label: 'Sa' },
];

export function EditEventModal({ visible, onClose, database, event }: EditEventModalProps) {
  const [title, setTitle] = useState(event?.title ?? '');
  const [startTime, setStartTime] = useState(event?.startTime ?? new Date());
  const [endTime, setEndTime] = useState(event?.endTime ?? new Date());
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(event?.userId ?? undefined);
  const [users, setUsers] = useState<User[]>([]);

  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<FrequencyType>('WEEKLY');
  const [recurrenceEndType, setRecurrenceEndType] = useState<RecurrenceEndType>('after_count');
  const [recurrenceCount, setRecurrenceCount] = useState('10');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date;
  });
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(['MO', 'WE', 'FR']);

  React.useEffect(() => {
    if (visible && event) {
      setTitle(event.title);
      setStartTime(event.startTime);
      setEndTime(event.endTime);
      setSelectedUserId(event.userId ?? undefined);
      
      // Basic recurrence initialization
      if (event.recurrenceRule) {
        setIsRecurring(true);
        // Simple parsing for display purposes
        if (event.recurrenceRule.includes('FREQ=DAILY')) setRecurrenceFrequency('DAILY');
        else if (event.recurrenceRule.includes('FREQ=WEEKLY')) setRecurrenceFrequency('WEEKLY');
        else if (event.recurrenceRule.includes('FREQ=MONTHLY')) setRecurrenceFrequency('MONTHLY');
        else if (event.recurrenceRule.includes('FREQ=YEARLY')) setRecurrenceFrequency('YEARLY');
        
        // Check for count
        const countMatch = event.recurrenceRule.match(/COUNT=(\d+)/);
        if (countMatch) {
          setRecurrenceEndType('after_count');
          setRecurrenceCount(countMatch[1]);
        } else if (event.recurrenceRule.includes('UNTIL=')) {
          setRecurrenceEndType('on_date');
          // Parsing UNTIL date is complex, skipping for now
        } else {
          setRecurrenceEndType('never');
        }
      } else {
        setIsRecurring(false);
        setRecurrenceFrequency('WEEKLY');
        setRecurrenceEndType('after_count');
        setRecurrenceCount('10');
      }

      const fetchUsers = async () => {
        const fetchedUsers = await database.get<User>('users').query(Q.where('family_id', event.familyId)).fetch();
        setUsers(fetchedUsers);
      };
      fetchUsers();
    }
  }, [visible, event, database]);
  
  // Android specific state
  const [mode, setMode] = useState<'date' | 'time'>('date');
  const [show, setShow] = useState(false);
  const [activeField, setActiveField] = useState<'start' | 'end' | 'recurrence_end'>('start');
  const [deleteMode, setDeleteMode] = useState(false);

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        // Don't allow deselecting if it's the last day
        if (prev.length === 1) return prev;
        return prev.filter(d => d !== day);
      }
      return [...prev, day];
    });
  };

  const handleUpdate = async () => {
    if (!event || !title) {
      alert('Please enter a title');
      return;
    }
    try {
      let recurrenceRule: string | undefined = event.recurrenceRule;
      
      // Only update recurrence rule if we are editing it or creating a new one
      if (isRecurring) {
        const options: RecurrenceOptions = {
          frequency: recurrenceFrequency === 'CUSTOM' ? 'WEEKLY' : recurrenceFrequency,
        };
        
        if (recurrenceFrequency === 'CUSTOM') {
          options.byDay = selectedDays;
        }
        
        if (recurrenceEndType === 'after_count') {
          const count = parseInt(recurrenceCount, 10);
          if (isNaN(count) || count <= 0) {
            alert('Please enter a valid number of occurrences');
            return;
          }
          options.count = count;
        } else if (recurrenceEndType === 'on_date') {
          options.until = recurrenceEndDate;
        }
        
        recurrenceRule = buildRecurrenceRule(options);
      } else {
        // If user turned off recurrence, clear the rule
        recurrenceRule = undefined;
      }

      await updateEvent(database, event.id, {
        title,
        startTime,
        endTime,
        userId: selectedUserId,
        recurrenceRule,
      });
      onClose();
    } catch (error) {
      log.error('Failed to update event:', error);
      alert('Failed to update event');
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    
    const isRecurring = !!event.recurrenceId || !!event.recurrenceRule;

    if (isRecurring) {
      if (Platform.OS === 'web') {
        setDeleteMode(true);
        return;
      } else {
        Alert.alert(
          'Delete Recurring Event',
          'Do you want to delete just this instance or all instances?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'This Instance', 
              onPress: () => performDelete('single') 
            },
            { 
              text: 'All Instances', 
              style: 'destructive',
              onPress: () => performDelete('all') 
            }
          ]
        );
        return;
      }
    }
    
    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to delete this event?')) {
        try {
          await deleteEvent(database, event.id);
          onClose();
        } catch (error) {
          log.error('Failed to delete event:', error);
          alert('Failed to delete event');
        }
      }
    } else {
      Alert.alert(
        'Delete Event',
        'Are you sure you want to delete this event?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteEvent(database, event.id);
                onClose();
              } catch (error) {
                log.error('Failed to delete event:', error);
                alert('Failed to delete event');
              }
            }
          }
        ]
      );
    }
  };

  const performDelete = async (type: 'single' | 'all') => {
    if (!event) return;
    try {
      await deleteRecurringEvent(database, event.id, type);
      onClose();
      setDeleteMode(false);
    } catch (error) {
      log.error('Failed to delete event:', error);
      alert('Failed to delete event');
    }
  };

  const onChange = (e: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    
    if (selectedDate) {
      if (activeField === 'start') {
        setStartTime(selectedDate);
        if (selectedDate > endTime) {
          setEndTime(new Date(selectedDate.getTime() + 3600000));
        }
      } else if (activeField === 'end') {
        setEndTime(selectedDate);
      } else if (activeField === 'recurrence_end') {
        setRecurrenceEndDate(selectedDate);
      }
    }
  };

  const showMode = (currentMode: 'date' | 'time', field: 'start' | 'end' | 'recurrence_end') => {
    setShow(true);
    setMode(currentMode);
    setActiveField(field);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  if (!event) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {deleteMode ? (
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Delete Recurring Event</Text>
            <TouchableOpacity onPress={() => setDeleteMode(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.content}>
             <Text style={[styles.label, { marginBottom: 20, fontSize: 16 }]}>Do you want to delete just this instance or all instances?</Text>
             
             <TouchableOpacity style={styles.updateButton} onPress={() => performDelete('single')}>
               <Text style={styles.updateButtonText}>Delete This Instance</Text>
             </TouchableOpacity>
             
             <TouchableOpacity style={styles.deleteButton} onPress={() => performDelete('all')}>
               <Text style={styles.deleteButtonText}>Delete All Instances</Text>
             </TouchableOpacity>

             <TouchableOpacity style={[styles.deleteButton, { borderColor: '#8E8E93', marginTop: 20 }]} onPress={() => setDeleteMode(false)}>
               <Text style={[styles.deleteButtonText, { color: '#8E8E93' }]}>Cancel</Text>
             </TouchableOpacity>
          </View>
        </View>
      ) : (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Edit Event</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Event title"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>For Who?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.userScroll}>
              <TouchableOpacity
                style={[
                  styles.userChip,
                  !selectedUserId && styles.userChipActive
                ]}
                onPress={() => setSelectedUserId(undefined)}
              >
                <Text style={[
                  styles.userChipText,
                  !selectedUserId && styles.userChipTextActive
                ]}>Everyone</Text>
              </TouchableOpacity>
              {users.map(user => (
                <TouchableOpacity
                  key={user.id}
                  style={[
                    styles.userChip,
                    selectedUserId === user.id && styles.userChipActive
                  ]}
                  onPress={() => setSelectedUserId(user.id)}
                >
                  <Text style={[
                    styles.userChipText,
                    selectedUserId === user.id && styles.userChipTextActive
                  ]}>{user.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Starts</Text>
            {Platform.OS === 'ios' ? (
              <View style={styles.dateTimeRow}>
                <DateTimePicker
                  testID="dateTimePicker"
                  value={startTime}
                  mode="datetime"
                  display="compact"
                  onChange={(e, date) => {
                    if (date) {
                      setStartTime(date);
                      if (date > endTime) {
                        setEndTime(new Date(date.getTime() + 3600000));
                      }
                    }
                  }}
                />
              </View>
            ) : Platform.OS === 'web' ? (
              <View style={styles.dateTimeRow}>
                {React.createElement('input', {
                  type: 'date',
                  value: startTime.toISOString().split('T')[0],
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    const [y, m, d] = e.target.value.split('-').map(Number);
                    if (y && m && d) {
                      const newDate = new Date(startTime);
                      newDate.setFullYear(y, m - 1, d);
                      setStartTime(newDate);
                      if (newDate > endTime) {
                        setEndTime(new Date(newDate.getTime() + 3600000));
                      }
                    }
                  },
                  style: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA', fontSize: 17, marginRight: 10, borderStyle: 'solid', backgroundColor: '#FFFFFF' }
                })}
                {React.createElement('input', {
                  type: 'time',
                  value: startTime.toTimeString().slice(0, 5),
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    const [hours, minutes] = e.target.value.split(':');
                    if (hours && minutes) {
                      const newDate = new Date(startTime);
                      newDate.setHours(parseInt(hours), parseInt(minutes));
                      setStartTime(newDate);
                      if (newDate > endTime) {
                        setEndTime(new Date(newDate.getTime() + 3600000));
                      }
                    }
                  },
                  style: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA', fontSize: 17, borderStyle: 'solid', backgroundColor: '#FFFFFF' }
                })}
              </View>
            ) : (
              <View style={styles.androidDateTimeRow}>
                <TouchableOpacity 
                  style={styles.dateButton} 
                  onPress={() => showMode('date', 'start')}
                >
                  <Text style={styles.dateButtonText}>{formatDate(startTime)}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.timeButton} 
                  onPress={() => showMode('time', 'start')}
                >
                  <Text style={styles.dateButtonText}>{formatTime(startTime)}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Ends</Text>
            {Platform.OS === 'ios' ? (
              <View style={styles.dateTimeRow}>
                <DateTimePicker
                  testID="dateTimePicker"
                  value={endTime}
                  mode="datetime"
                  display="compact"
                  onChange={(e, date) => date && setEndTime(date)}
                  minimumDate={startTime}
                />
              </View>
            ) : Platform.OS === 'web' ? (
              <View style={styles.dateTimeRow}>
                {React.createElement('input', {
                  type: 'date',
                  value: endTime.toISOString().split('T')[0],
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    const [y, m, d] = e.target.value.split('-').map(Number);
                    if (y && m && d) {
                      const newDate = new Date(endTime);
                      newDate.setFullYear(y, m - 1, d);
                      setEndTime(newDate);
                    }
                  },
                  style: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA', fontSize: 17, marginRight: 10, borderStyle: 'solid', backgroundColor: '#FFFFFF' }
                })}
                {React.createElement('input', {
                  type: 'time',
                  value: endTime.toTimeString().slice(0, 5),
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    const [hours, minutes] = e.target.value.split(':');
                    if (hours && minutes) {
                      const newDate = new Date(endTime);
                      newDate.setHours(parseInt(hours), parseInt(minutes));
                      setEndTime(newDate);
                    }
                  },
                  style: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA', fontSize: 17, borderStyle: 'solid', backgroundColor: '#FFFFFF' }
                })}
              </View>
            ) : (
              <View style={styles.androidDateTimeRow}>
                <TouchableOpacity 
                  style={styles.dateButton} 
                  onPress={() => showMode('date', 'end')}
                >
                  <Text style={styles.dateButtonText}>{formatDate(endTime)}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.timeButton} 
                  onPress={() => showMode('time', 'end')}
                >
                  <Text style={styles.dateButtonText}>{formatTime(endTime)}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <View style={styles.checkboxRow}>
              <TouchableOpacity 
                style={styles.checkbox}
                onPress={() => setIsRecurring(!isRecurring)}
              >
                <View style={[styles.checkboxInner, isRecurring && styles.checkboxChecked]}>
                  {isRecurring && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Recurring Event</Text>
              </TouchableOpacity>
            </View>

            {isRecurring && (
              <View style={styles.recurrenceOptions}>
                <Text style={styles.label}>Frequency</Text>
                <View style={styles.frequencyButtons}>
                  {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM'] as const).map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.frequencyButton,
                        recurrenceFrequency === freq && styles.frequencyButtonActive
                      ]}
                      onPress={() => setRecurrenceFrequency(freq)}
                    >
                      <Text style={[
                        styles.frequencyButtonText,
                        recurrenceFrequency === freq && styles.frequencyButtonTextActive
                      ]}>
                        {freq.charAt(0) + freq.slice(1).toLowerCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom days selector */}
                {recurrenceFrequency === 'CUSTOM' && (
                  <View style={styles.customDaysSection}>
                    <Text style={styles.label}>Repeat on</Text>
                    <View style={styles.daysRow}>
                      {DAYS_OF_WEEK.map((day) => (
                        <TouchableOpacity
                          key={day.key}
                          style={[
                            styles.dayButton,
                            selectedDays.includes(day.key) && styles.dayButtonActive
                          ]}
                          onPress={() => toggleDay(day.key)}
                        >
                          <Text style={[
                            styles.dayButtonText,
                            selectedDays.includes(day.key) && styles.dayButtonTextActive
                          ]}>
                            {day.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <Text style={[styles.label, styles.recurrenceEndLabel]}>Ends</Text>
                <View style={styles.endTypeButtons}>
                  {([
                    { key: 'never' as const, label: 'Never' },
                    { key: 'on_date' as const, label: 'On Date' },
                    { key: 'after_count' as const, label: 'After' },
                  ]).map((endType) => (
                    <TouchableOpacity
                      key={endType.key}
                      style={[
                        styles.endTypeButton,
                        recurrenceEndType === endType.key && styles.endTypeButtonActive
                      ]}
                      onPress={() => setRecurrenceEndType(endType.key)}
                    >
                      <Text style={[
                        styles.endTypeButtonText,
                        recurrenceEndType === endType.key && styles.endTypeButtonTextActive
                      ]}>
                        {endType.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Recurrence end date picker */}
                {recurrenceEndType === 'on_date' && (
                  <View style={styles.endDateSection}>
                    {Platform.OS === 'ios' ? (
                      <DateTimePicker
                        testID="recurrenceEndDatePicker"
                        value={recurrenceEndDate}
                        mode="date"
                        display="compact"
                        onChange={(e, date) => date && setRecurrenceEndDate(date)}
                        minimumDate={startTime}
                      />
                    ) : Platform.OS === 'web' ? (
                      React.createElement('input', {
                        type: 'date',
                        value: recurrenceEndDate.toISOString().split('T')[0],
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                          const [y, m, d] = e.target.value.split('-').map(Number);
                          if (y && m && d) {
                            const newDate = new Date(recurrenceEndDate);
                            newDate.setFullYear(y, m - 1, d);
                            setRecurrenceEndDate(newDate);
                          }
                        },
                        style: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA', fontSize: 17, borderStyle: 'solid', backgroundColor: '#FFFFFF', width: '100%' }
                      })
                    ) : (
                      <TouchableOpacity 
                        style={styles.endDateButton} 
                        onPress={() => showMode('date', 'recurrence_end')}
                      >
                        <Text style={styles.dateButtonText}>{formatDate(recurrenceEndDate)}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Occurrence count input */}
                {recurrenceEndType === 'after_count' && (
                  <View style={styles.countSection}>
                    <TextInput
                      style={styles.countInput}
                      value={recurrenceCount}
                      onChangeText={setRecurrenceCount}
                      placeholder="10"
                      keyboardType="numeric"
                    />
                    <Text style={styles.countLabel}>occurrences</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {Platform.OS === 'android' && show && (
            <DateTimePicker
              testID="dateTimePicker"
              value={activeField === 'start' ? startTime : activeField === 'end' ? endTime : recurrenceEndDate}
              mode={mode}
              is24Hour={false}
              display="default"
              onChange={onChange}
              minimumDate={activeField === 'end' ? startTime : activeField === 'recurrence_end' ? startTime : undefined}
            />
          )}

          <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
            <Text style={styles.updateButtonText}>Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete Event</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#8E8E93',
  },
  content: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    fontSize: 17,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  updateButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 17,
    fontWeight: '600',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  androidDateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginRight: 8,
  },
  timeButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginLeft: 8,
  },
  dateButtonText: {
    fontSize: 17,
    color: '#000000',
    textAlign: 'center',
  },
  userScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  userChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginRight: 8,
  },
  userChipActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  userChipText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
  },
  userChipTextActive: {
    color: '#FFFFFF',
  },
  checkboxRow: {
    marginBottom: 12,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4A90E2',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4A90E2',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 17,
    color: '#000000',
  },
  recurrenceOptions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  frequencyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  frequencyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  frequencyButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  frequencyButtonText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
  },
  frequencyButtonTextActive: {
    color: '#FFFFFF',
  },
  recurrenceEndLabel: {
    marginTop: 16,
  },
  dateButtonFullWidth: {
    marginRight: 0,
  },
  customDaysSection: {
    marginBottom: 16,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  dayButtonText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '600',
  },
  dayButtonTextActive: {
    color: '#FFFFFF',
  },
  endTypeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  endTypeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  endTypeButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  endTypeButtonText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  endTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  endDateSection: {
    marginTop: 8,
  },
  endDateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  countSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  countInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    fontSize: 17,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    width: 80,
    textAlign: 'center',
  },
  countLabel: {
    fontSize: 16,
    color: '#000000',
  },
});
