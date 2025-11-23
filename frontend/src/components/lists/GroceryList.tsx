import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Database, Q } from '@nozbe/watermelondb';
import { GroceryItem } from '../../model/models';

interface GroceryListProps {
  database: Database;
  familyId: string;
}

export function GroceryList({ database, familyId }: GroceryListProps) {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadItems = async () => {
    try {
      const groceryItems = await database
        .get<GroceryItem>('grocery_items')
        .query(Q.where('family_id', familyId))
        .fetch();
      
      // Sort: unchecked items first, then by creation date
      const sorted = groceryItems.sort((a, b) => {
        if (a.isChecked !== b.isChecked) {
          return a.isChecked ? 1 : -1;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      
      setItems(sorted);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading grocery items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;

    try {
      await database.write(async () => {
        await database.get<GroceryItem>('grocery_items').create((item) => {
          item.familyId = familyId;
          item.name = newItemName.trim();
          item.isChecked = false;
        });
      });

      setNewItemName('');
      await loadItems();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error adding grocery item:', error);
      alert('Failed to add item');
    }
  };

  const handleToggleCheck = async (item: GroceryItem) => {
    try {
      await database.write(async () => {
        await item.update((i) => {
          i.isChecked = !i.isChecked;
        });
      });

      await loadItems();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error toggling item:', error);
      alert('Failed to update item');
    }
  };

  const handleDeleteItem = async (item: GroceryItem) => {
    try {
      await database.write(async () => {
        await item.markAsDeleted();
      });

      await loadItems();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const handleClearCompleted = async () => {
    const checkedItems = items.filter((item) => item.isChecked);
    if (checkedItems.length === 0) return;

    const confirmed = confirm(`Delete ${checkedItems.length} checked item(s)?`);
    if (!confirmed) return;

    try {
      await database.write(async () => {
        for (const item of checkedItems) {
          await item.markAsDeleted();
        }
      });

      await loadItems();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error clearing completed items:', error);
      alert('Failed to clear completed items');
    }
  };

  const renderItem = ({ item }: { item: GroceryItem }) => {
    return (
      <View style={styles.itemCard}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleToggleCheck(item)}
        >
          <View style={[styles.checkboxInner, item.isChecked && styles.checkboxChecked]}>
            {item.isChecked && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>

        <Text style={[styles.itemName, item.isChecked && styles.itemNameChecked]}>
          {item.name}
        </Text>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item)}
        >
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const uncheckedCount = items.filter((item) => !item.isChecked).length;
  const checkedCount = items.filter((item) => item.isChecked).length;

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading grocery list...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Grocery List</Text>
        <View style={styles.stats}>
          <Text style={styles.statsText}>
            {uncheckedCount} to buy • {checkedCount} checked
          </Text>
        </View>
      </View>

      <View style={styles.addSection}>
        <TextInput
          style={styles.input}
          value={newItemName}
          onChangeText={setNewItemName}
          placeholder="Add new item..."
          returnKeyType="done"
          onSubmitEditing={handleAddItem}
        />
        <TouchableOpacity 
          style={[styles.addButton, !newItemName.trim() && styles.addButtonDisabled]}
          onPress={handleAddItem}
          disabled={!newItemName.trim()}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>Your grocery list is empty</Text>
          <Text style={styles.emptySubtext}>Add items above to get started!</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
          />

          {checkedCount > 0 && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearCompleted}
              >
                <Text style={styles.clearButtonText}>
                  Clear {checkedCount} Checked Item{checkedCount !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
  },
  statsText: {
    fontSize: 14,
    color: '#64748B',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#64748B',
  },
  addSection: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  itemNameChecked: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  clearButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
