import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Database, Q } from '@nozbe/watermelondb';
import { List, GroceryItem, ListItem } from '../../model/models';

interface AllListsProps {
  database: Database;
  familyId: string;
  onSelectList: (list: List) => void;
}

export function AllLists({ database, familyId, onSelectList }: AllListsProps) {
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newListName, setNewListName] = useState('');

  useEffect(() => {
    loadLists();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLists = async () => {
    try {
      const allLists = await database
        .get<List>('lists')
        .query(Q.where('family_id', familyId))
        .fetch();
      
      // If no lists exist, create default Grocery List
      if (allLists.length === 0) {
        await createDefaultGroceryList();
        return;
      }

      setLists(allLists);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultGroceryList = async () => {
    try {
      await database.write(async () => {
        const newList = await database.get<List>('lists').create((list) => {
          list.familyId = familyId;
          list.name = 'Grocery List';
          list.type = 'GROCERY';
        });

        // Migrate existing grocery items
        const oldItems = await database
          .get<GroceryItem>('grocery_items')
          .query(Q.where('family_id', familyId))
          .fetch();
        
        for (const oldItem of oldItems) {
          await database.get<ListItem>('list_items').create((newItem) => {
            newItem.listId = newList.id;
            newItem.text = oldItem.name;
            newItem.isChecked = oldItem.isChecked;
          });
        }
      });
      await loadLists();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating default list:', error);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    try {
      await database.write(async () => {
        await database.get<List>('lists').create((list) => {
          list.familyId = familyId;
          list.name = newListName.trim();
          list.type = 'TODO';
        });
      });

      setNewListName('');
      setIsModalVisible(false);
      await loadLists();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating list:', error);
      alert('Failed to create list');
    }
  };

  const renderListCard = ({ item }: { item: List }) => (
    <TouchableOpacity
      style={styles.listCard}
      onPress={() => onSelectList(item)}
    >
      <View style={styles.listIconContainer}>
        <Text style={styles.listIcon}>
          {item.type === 'GROCERY' ? '🛒' : '📝'}
        </Text>
      </View>
      <View style={styles.listInfo}>
        <Text style={styles.listName}>{item.name}</Text>
        <Text style={styles.listType}>{item.type === 'GROCERY' ? 'Grocery List' : 'To-Do List'}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading lists...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Lists</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.createButtonText}>+ New List</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={lists}
        renderItem={renderListCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New List</Text>
            <TextInput
              style={styles.input}
              placeholder="List Name"
              value={newListName}
              onChangeText={setNewListName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleCreateList}
              >
                <Text style={styles.saveButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  createButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#64748B',
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    elevation: 1,
  },
  listIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  listIcon: {
    fontSize: 24,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  listType: {
    fontSize: 14,
    color: '#64748B',
  },
  chevron: {
    fontSize: 24,
    color: '#CBD5E1',
    fontWeight: '600',
  },
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
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
  },
  cancelButtonText: {
    color: '#64748B',
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
