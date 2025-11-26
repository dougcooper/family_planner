import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Task, User } from '../../model/models';
import { Database } from '@nozbe/watermelondb';
import { markTaskPendingReview, resetTask, approveTask, deleteTask } from '../../logic/task';

interface TaskDetailProps {
  task: Task;
  database: Database;
  currentUserId: string;
  currentUserRole: 'PARENT' | 'CHILD';
  onClose: () => void;
}

export function TaskDetail({ task, database, currentUserId, currentUserRole, onClose }: TaskDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [points, setPoints] = useState(task.points.toString());
  const [assigneeId, setAssigneeId] = useState(task.assigneeId);
  const [assigneeName, setAssigneeName] = useState('Loading...');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await database.get<User>('users').find(task.assigneeId);
        setAssigneeName(user.name);
      } catch {
        setAssigneeName('Unknown');
      }

      if (currentUserRole === 'PARENT') {
        const allUsers = await database.get<User>('users').query().fetch();
        setUsers(allUsers);
      }
    };
    loadData();
  }, [task.assigneeId, database, currentUserRole]);

  const isAssignedToCurrentUser = task.assigneeId === currentUserId;
  const canEdit = currentUserRole === 'PARENT' || (isAssignedToCurrentUser && task.status === 'TODO');
  const canMarkComplete = (isAssignedToCurrentUser || currentUserRole === 'PARENT') && task.status === 'TODO';

  const handleSave = async () => {
    await database.write(async () => {
      await task.update((t) => {
        t.title = title;
        t.description = description;
        if (currentUserRole === 'PARENT') {
          t.points = parseInt(points, 10);
          t.assigneeId = assigneeId;
        }
      });
    });
    setIsEditing(false);
  };

  const handleMarkComplete = async () => {
    try {
      await markTaskPendingReview(database, task.id);
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error marking task complete:', error);
      alert(error instanceof Error ? error.message : 'Failed to mark task complete');
    }
  };

  const handleReset = async () => {
    try {
      await resetTask(database, task.id);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error resetting task:', error);
      alert(error instanceof Error ? error.message : 'Failed to reset task');
    }
  };

  const handleApprove = async () => {
    try {
      await approveTask(database, task.id);
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error approving task:', error);
      alert(error instanceof Error ? error.message : 'Failed to approve task');
    }
  };

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this task?')) {
        deleteTask(database, task.id)
          .then(() => onClose())
          .catch((error) => {
            // eslint-disable-next-line no-console
            console.error('Error deleting task:', error);
            alert('Failed to delete task');
          });
      }
    } else {
      Alert.alert(
        'Delete Task',
        'Are you sure you want to delete this task?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteTask(database, task.id);
                onClose();
              } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Error deleting task:', error);
                alert('Failed to delete task');
              }
            },
          },
        ]
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return '#94A3B8';
      case 'PENDING_REVIEW':
        return '#F59E0B';
      case 'COMPLETED':
        return '#10B981';
      default:
        return '#94A3B8';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'To Do';
      case 'PENDING_REVIEW':
        return 'Pending Review';
      case 'COMPLETED':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Task Details</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(task.status) }]} />
          <Text style={styles.statusText}>{getStatusLabel(task.status)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Title</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Task title"
            />
          ) : (
            <Text style={styles.value}>{task.title}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          {isEditing ? (
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Task description"
              multiline
              numberOfLines={4}
            />
          ) : (
            <Text style={styles.value}>{task.description || 'No description'}</Text>
          )}
        </View>

        <View style={styles.row}>
          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Points</Text>
            {isEditing && currentUserRole === 'PARENT' ? (
              <TextInput
                style={styles.input}
                value={points}
                onChangeText={setPoints}
                placeholder="Points"
                keyboardType="numeric"
              />
            ) : (
              <Text style={styles.value}>{task.points} pts</Text>
            )}
          </View>

          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Assigned To</Text>
            {isEditing && currentUserRole === 'PARENT' ? (
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
            ) : (
              <Text style={styles.value}>{assigneeName}</Text>
            )}
          </View>
        </View>

        {task.dueDate && (
          <View style={styles.section}>
            <Text style={styles.label}>Due Date</Text>
            <Text style={styles.value}>
              {task.dueDate.toLocaleDateString()}
            </Text>
          </View>
        )}

        {task.recurrenceRule && (
          <View style={styles.section}>
            <Text style={styles.label}>Recurrence</Text>
            <Text style={styles.value}>{task.recurrenceRule}</Text>
          </View>
        )}

        <View style={styles.actions}>
          {isEditing ? (
            <>
              <TouchableOpacity style={styles.buttonPrimary} onPress={handleSave}>
                <Text style={styles.buttonPrimaryText}>Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.buttonSecondary} 
                onPress={() => {
                  setIsEditing(false);
                  setTitle(task.title);
                  setDescription(task.description || '');
                  setPoints(task.points.toString());
                }}
              >
                <Text style={styles.buttonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {canEdit && (
                <TouchableOpacity 
                  style={styles.buttonSecondary} 
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.buttonSecondaryText}>Edit</Text>
                </TouchableOpacity>
              )}
              
              {canMarkComplete && (
                <TouchableOpacity 
                  style={styles.buttonPrimary} 
                  onPress={handleMarkComplete}
                >
                  <Text style={styles.buttonPrimaryText}>Mark Complete</Text>
                </TouchableOpacity>
              )}

              {currentUserRole === 'PARENT' && task.status === 'PENDING_REVIEW' && (
                <TouchableOpacity 
                  style={styles.buttonPrimary} 
                  onPress={handleApprove}
                >
                  <Text style={styles.buttonPrimaryText}>Approve & Award Points</Text>
                </TouchableOpacity>
              )}

              {currentUserRole === 'PARENT' && task.status !== 'TODO' && (
                <TouchableOpacity 
                  style={styles.buttonSecondary} 
                  onPress={handleReset}
                >
                  <Text style={styles.buttonSecondaryText}>
                    {task.status === 'PENDING_REVIEW' ? 'Reject / Reset' : 'Reset to To Do'}
                  </Text>
                </TouchableOpacity>
              )}

              {currentUserRole === 'PARENT' && (
                <TouchableOpacity 
                  style={styles.buttonDestructive} 
                  onPress={handleDelete}
                >
                  <Text style={styles.buttonDestructiveText}>Delete Task</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#64748B',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: '#1E293B',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  buttonPrimary: {
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSecondaryText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDestructive: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDestructiveText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
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
});
