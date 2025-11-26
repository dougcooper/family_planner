import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert } from 'react-native';
import { Database, Q } from '@nozbe/watermelondb';
import { withObservables } from '@nozbe/watermelondb/react';
import { MealLabel } from '../../model/models';
import log from '../../utils/logger';

interface MealLabelSettingsProps {
  database: Database;
  familyId: string;
  mealLabels: MealLabel[];
}

function MealLabelSettingsComponent({ database, familyId, mealLabels }: MealLabelSettingsProps) {
  const [newLabelName, setNewLabelName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddLabel = async () => {
    if (!newLabelName.trim()) return;

    try {
      await database.write(async () => {
        const count = await database.get<MealLabel>('meal_labels')
          .query(Q.where('family_id', familyId))
          .fetchCount();

        await database.get<MealLabel>('meal_labels').create(label => {
          label.familyId = familyId;
          label.name = newLabelName.trim();
          label.sortOrder = count;
        });
      });
      setNewLabelName('');
      setIsAdding(false);
    } catch (error) {
      log.error('Error adding meal label:', error);
      Alert.alert('Error', 'Failed to add meal label');
    }
  };

  const handleDeleteLabel = async (label: MealLabel) => {
    Alert.alert(
      'Delete Label',
      `Are you sure you want to delete "${label.name}"? This will delete all meal plans associated with this label.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.write(async () => {
                await label.markAsDeleted();
              });
            } catch (error) {
              log.error('Error deleting label:', error);
              Alert.alert('Error', 'Failed to delete label');
            }
          },
        },
      ]
    );
  };

  const sortedLabels = [...mealLabels].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleMoveLabel = async (label: MealLabel, direction: 'up' | 'down') => {
    const index = sortedLabels.findIndex(l => l.id === label.id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedLabels.length) return;

    const targetLabel = sortedLabels[targetIndex];
    
    // Swap sortOrders
    const currentSortOrder = label.sortOrder;
    const targetSortOrder = targetLabel.sortOrder;

    try {
      await database.write(async () => {
        await label.update(l => {
          l.sortOrder = targetSortOrder;
        });
        await targetLabel.update(l => {
          l.sortOrder = currentSortOrder;
        });
      });
    } catch (error) {
      log.error('Error moving label:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meal Labels</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setIsAdding(!isAdding)}
        >
          <Text style={styles.addButtonText}>{isAdding ? 'Cancel' : '+ Add Label'}</Text>
        </TouchableOpacity>
      </View>

      {isAdding && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            value={newLabelName}
            onChangeText={setNewLabelName}
            placeholder="Label Name (e.g., Snack)"
            autoFocus
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleAddLabel}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={sortedLabels}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.labelRow}>
            <Text style={styles.labelText}>{item.name}</Text>
            <View style={styles.actions}>
              <TouchableOpacity 
                onPress={() => handleMoveLabel(item, 'up')} 
                disabled={index === 0}
                style={[styles.actionButton, index === 0 && styles.disabledButton]}
              >
                <Text style={styles.actionText}>↑</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handleMoveLabel(item, 'down')} 
                disabled={index === sortedLabels.length - 1}
                style={[styles.actionButton, index === sortedLabels.length - 1 && styles.disabledButton]}
              >
                <Text style={styles.actionText}>↓</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handleDeleteLabel(item)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  addButton: {
    padding: 8,
  },
  addButtonText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  addForm: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  labelText: {
    fontSize: 16,
    color: '#334155',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
  },
  disabledButton: {
    opacity: 0.3,
  },
  actionText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 4,
    marginLeft: 8,
  },
  deleteText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: 'bold',
  },
});

export const MealLabelSettings = withObservables(['familyId'], ({ database, familyId }: MealLabelSettingsProps) => ({
  mealLabels: database.get<MealLabel>('meal_labels')
    .query(
      Q.where('family_id', familyId),
      Q.sortBy('sort_order', Q.asc)
    )
    .observe(),
}))(MealLabelSettingsComponent);
