import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Database } from '@nozbe/watermelondb';
import { User } from '../../model/models';
import { createTask } from '../../logic/task';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  database: Database;
  currentUserId: string;
  familyId: string;
}

export function CreateTaskModal({ visible, onClose, database, familyId }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('10');
  const [assigneeId, setAssigneeId] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const allUsers = await database.get<User>('users').query().fetch();
      setUsers(allUsers);
    };
    if (visible) {
      fetchUsers();
    }
  }, [visible, database]);

  const handleCreate = async () => {
    if (!title || !assigneeId) {
      alert('Please enter a title and select an assignee');
      return;
    }
    try {
      await createTask(database, {
        title,
        description,
        points: parseInt(points, 10) || 0,
        assigneeId,
        familyId,
      });
      setTitle('');
      setDescription('');
      setPoints('10');
      setAssigneeId('');
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>New Task</Text>
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
              placeholder="Task title"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Description (optional)"
              multiline
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Points</Text>
            <TextInput
              style={styles.input}
              value={points}
              onChangeText={setPoints}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Assign To</Text>
            <View style={styles.userList}>
              {users.map(user => (
                <TouchableOpacity
                  key={user.id}
                  style={[
                    styles.userChip,
                    assigneeId === user.id && styles.userChipSelected
                  ]}
                  onPress={() => setAssigneeId(user.id)}
                >
                  <Text style={[
                    styles.userChipText,
                    assigneeId === user.id && styles.userChipTextSelected
                  ]}>
                    {user.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.createButton, (!title || !assigneeId) && styles.createButtonDisabled]} 
            onPress={handleCreate}
            disabled={!title || !assigneeId}
          >
            <Text style={styles.createButtonText}>Create Task</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#64748B',
  },
  content: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#0F172A',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  userList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  userChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  userChipSelected: {
    backgroundColor: '#3B82F6',
  },
  userChipText: {
    fontSize: 14,
    color: '#475569',
  },
  userChipTextSelected: {
    color: 'white',
  },
  createButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.7,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
