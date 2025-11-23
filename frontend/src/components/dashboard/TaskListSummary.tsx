import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Task } from '../../model/models';

interface TaskListSummaryProps {
  tasks: Task[];
}

export function TaskListSummary({ tasks }: TaskListSummaryProps) {
  const todoTasks = tasks.filter(t => t.status === 'TODO');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const pendingReview = tasks.filter(t => t.status === 'PENDING_REVIEW');

  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.taskItem}>
      <View style={[styles.statusDot, getStatusStyle(item.status)]} />
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text style={styles.taskPoints}>{item.points} pts</Text>
    </View>
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'TODO':
        return { backgroundColor: '#E0E0E0' };
      case 'PENDING_REVIEW':
        return { backgroundColor: '#FFA726' };
      case 'COMPLETED':
        return { backgroundColor: '#66BB6A' };
      default:
        return { backgroundColor: '#E0E0E0' };
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Tasks</Text>
      
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryCount}>{todoTasks.length}</Text>
          <Text style={styles.summaryLabel}>To Do</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: '#FFA726' }]}>
            {pendingReview.length}
          </Text>
          <Text style={styles.summaryLabel}>Review</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: '#66BB6A' }]}>
            {completedTasks.length}
          </Text>
          <Text style={styles.summaryLabel}>Done</Text>
        </View>
      </View>

      {tasks.length > 0 ? (
        <FlatList
          data={tasks.slice(0, 5)}
          renderItem={renderTask}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No tasks for today</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  taskPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
