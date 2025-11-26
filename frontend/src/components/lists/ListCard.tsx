import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { List, ListItem } from '../../model/models';

interface ListCardProps {
  list: List;
  items: ListItem[];
  onPress: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
}

const ListCard = ({ list, items, onPress, onDelete, onArchive, onUnarchive }: ListCardProps) => {
  const totalCount = items.length;
  const completedCount = items.filter(i => i.isChecked).length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete "${list.name}"?`)) {
        onDelete();
      }
    } else {
      Alert.alert(
        'Delete List',
        `Are you sure you want to delete "${list.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive', 
            onPress: onDelete 
          },
        ]
      );
    }
  };

  const handleArchive = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to archive "${list.name}"?`)) {
        onArchive();
      }
    } else {
      Alert.alert(
        'Archive List',
        `Are you sure you want to archive "${list.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Archive', 
            onPress: onArchive 
          },
        ]
      );
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.mainContent} onPress={onPress}>
        <View style={styles.header}>
          <Text style={styles.title}>{list.name}</Text>
          {list.type !== 'GROCERY' && (
            <View style={styles.actions}>
              {!list.isArchived ? (
                <TouchableOpacity 
                  onPress={handleArchive}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionText}>Archive</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity 
                    onPress={onUnarchive}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionText}>Unarchive</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleDelete}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    style={styles.headerDeleteButton}
                  >
                    <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
        
        <View style={styles.stats}>
          <Text style={styles.countText}>
            {completedCount}/{totalCount} items
          </Text>
        </View>

        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mainContent: {
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  headerDeleteButton: {
    padding: 5,
    marginLeft: 10,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 5,
    marginLeft: 10,
  },
  actionText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
  },
  deleteText: {
    color: '#EF4444',
  },
  stats: {
    marginBottom: 8,
  },
  countText: {
    fontSize: 14,
    color: '#666',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
});

const enhance = withObservables(['list'], ({ list }: { list: List }) => ({
  list,
  items: list.collection.database.get<ListItem>('list_items').query(Q.where('list_id', list.id)).observe(),
}));

export default enhance(ListCard);
