import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';
import { List, ListItem } from '../../model/models';

interface ListSummaryItemProps {
  list: List;
  items: ListItem[];
}

const ListSummaryItem = ({ list, items }: ListSummaryItemProps) => {
  const total = items.length;
  const completed = items.filter(i => i.isChecked).length;
  const progress = total > 0 ? completed / total : 0;

  return (
    <View style={styles.listItem}>
      <View style={styles.listHeader}>
        <Text style={styles.listIcon}>📝</Text>
        <View style={styles.listInfo}>
          <Text style={styles.listName} numberOfLines={1}>{list.name}</Text>
          <Text style={styles.listType}>{list.type}</Text>
        </View>
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{completed}/{total}</Text>
      </View>
    </View>
  );
};

const EnhancedListSummaryItem = withObservables(['list'], ({ list }: { list: List }) => ({
  list,
  items: list.items,
}))(ListSummaryItem);

interface ListsSummaryProps {
  lists: List[];
}

export function ListsSummary({ lists }: ListsSummaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Lists</Text>
      {lists.length > 0 ? (
        <View style={styles.listContainer}>
          {lists.slice(0, 3).map(list => (
            <EnhancedListSummaryItem key={list.id} list={list} />
          ))}
          {lists.length > 3 && (
            <Text style={styles.moreText}>+ {lists.length - 3} more</Text>
          )}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No lists yet</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
    flex: 1,
    minWidth: '45%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  listContainer: {
    gap: 16,
  },
  listItem: {
    gap: 8,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listInfo: {
    flex: 1,
  },
  listIcon: {
    fontSize: 16,
  },
  listName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  listType: {
    fontSize: 10,
    color: '#999',
    textTransform: 'uppercase',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    width: 30,
    textAlign: 'right',
  },
  moreText: {
    fontSize: 12,
    color: '#4A90E2',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 8,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
});
