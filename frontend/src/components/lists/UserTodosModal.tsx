import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../model/database';
import { ListItem, User, List } from '../../model/models';

interface ListSectionProps {
  list: List;
  todos: ListItem[];
}

const ListSectionComponent = ({ list, todos }: ListSectionProps) => {
  if (todos.length === 0) return null;

  const handleToggleCheck = async (item: ListItem) => {
    try {
      await database.write(async () => {
        await item.update((i) => {
          i.isChecked = !i.isChecked;
        });
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error toggling item:', error);
    }
  };

  return (
    <View style={styles.listSection}>
      <Text style={styles.listName}>{list.name}</Text>
      {todos.map(todo => (
        <View key={todo.id} style={styles.todoItem}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => handleToggleCheck(todo)}
          >
            <View style={[styles.checkboxInner, todo.isChecked && styles.checkboxChecked]}>
              {todo.isChecked && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
          <Text style={[styles.todoText, todo.isChecked && styles.todoTextChecked]}>
            {todo.text}
          </Text>
        </View>
      ))}
    </View>
  );
};

const ListSection = withObservables(['list', 'userId'], ({ list, userId }: { list: List, userId: string }) => ({
  todos: list.items.extend(
    Q.where('assignee_id', userId),
    Q.where('is_checked', false)
  ),
}))(ListSectionComponent);

interface UserTodosModalProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  lists: List[];
}

const UserTodosModalComponent = ({ visible, onClose, user, lists }: UserTodosModalProps) => {
  if (!user) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{user.name}&apos;s Todos</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={lists}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <ListSection list={item} userId={user.id} />
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No assigned todos</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#64748B',
  },
  listContent: {
    paddingVertical: 16,
  },
  listSection: {
    marginBottom: 16,
  },
  listName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    paddingHorizontal: 16,
    textTransform: 'uppercase',
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  todoText: {
    fontSize: 16,
    color: '#334155',
    flex: 1,
  },
  todoTextChecked: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  checkbox: {
    padding: 4,
    marginRight: 12,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 20,
    fontSize: 16,
    paddingHorizontal: 16,
  },
});

export const UserTodosModal = withObservables(['user'], ({ user }: { user: User | null }) => ({
  lists: user ? database.collections.get<List>('lists').query(
    Q.experimentalJoinTables(['list_items']),
    Q.on('list_items', 'assignee_id', user.id),
    Q.on('list_items', 'is_checked', false),
    Q.where('is_archived', false)
  ) : database.collections.get<List>('lists').query(
    Q.where('id', 'non_existent_id')
  ),
}))(UserTodosModalComponent);
