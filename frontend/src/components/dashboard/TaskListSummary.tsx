import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';
import { Task, User } from '../../model/models';

interface TaskListSummaryProps {
  tasks: Task[];
}

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

const TaskRow = ({ task, assignee }: { task: Task, assignee: User }) => (
  <View style={styles.taskItem}>
    <View style={[styles.statusDot, getStatusStyle(task.status)]} />
    <View style={styles.taskContent}>
      <Text style={styles.taskTitle}>{task.title}</Text>
      {assignee && <Text style={styles.assigneeName}>{assignee.name}</Text>}
    </View>
    <Text style={styles.taskPoints}>{task.points} pts</Text>
  </View>
);

const EnhancedTaskRow = withObservables(['task'], ({ task }: { task: Task }) => ({
  task: task.observe(),
  assignee: task.assignee.observe(),
}))(TaskRow);

export function TaskListSummary({ tasks }: TaskListSummaryProps) {
  const todoTasks = tasks.filter(t => t.status === 'TODO');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const pendingReview = tasks.filter(t => t.status === 'PENDING_REVIEW');

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
          renderItem={({ item }) => <EnhancedTaskRow task={item} />}
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
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  assigneeName: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  taskPoints: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
