import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Database } from '@nozbe/watermelondb';
import { createEvent } from '../../logic/events';

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  database: Database;
  familyId: string;
}

export function CreateEventModal({ visible, onClose, database, familyId }: CreateEventModalProps) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(() => new Date(Date.now() + 3600000));
  
  // Android specific state
  const [mode, setMode] = useState<'date' | 'time'>('date');
  const [show, setShow] = useState(false);
  const [activeField, setActiveField] = useState<'start' | 'end'>('start');

  const handleCreate = async () => {
    if (!title) {
      alert('Please enter a title');
      return;
    }
    try {
      await createEvent(database, {
        title,
        startTime,
        endTime,
        familyId,
      });
      setTitle('');
      setStartTime(new Date());
      setEndTime(new Date(Date.now() + 3600000));
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to create event:', error);
      alert('Failed to create event');
    }
  };

  const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    
    if (selectedDate) {
      if (activeField === 'start') {
        setStartTime(selectedDate);
        // Auto-adjust end time if it's before start time
        if (selectedDate > endTime) {
          setEndTime(new Date(selectedDate.getTime() + 3600000));
        }
      } else {
        setEndTime(selectedDate);
      }
    }
  };

  const showMode = (currentMode: 'date' | 'time', field: 'start' | 'end') => {
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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>New Event</Text>
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

          {Platform.OS === 'android' && show && (
            <DateTimePicker
              testID="dateTimePicker"
              value={activeField === 'start' ? startTime : endTime}
              mode={mode}
              is24Hour={false}
              display="default"
              onChange={onChange}
              minimumDate={activeField === 'end' ? startTime : undefined}
            />
          )}

          <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
            <Text style={styles.createButtonText}>Create Event</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
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
  createButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    color: '#FFFFFF',
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
});
