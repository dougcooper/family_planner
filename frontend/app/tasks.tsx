import React from 'react';
import { View, Text, StyleSheet, FlatList, Platform } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../src/model/database';
import { Task } from '../src/model/models';
import { DashboardLayout } from '../src/components/dashboard/DashboardLayout';

interface TasksScreenProps {
  tasks: Task[];
}

const TasksScreen = ({ tasks }: TasksScreenProps) => {
  const renderItem = ({ item }: { item: Task }) => (
    <View style={styles.taskItem}>
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text style={styles.taskStatus}>{item.status}</Text>
      <Text style={styles.taskPoints}>{item.points} pts</Text>
    </View>
  );

  return (
    <DashboardLayout>
      <View style={styles.container}>
        <Text style={styles.header}>All Tasks</Text>
        <FlatList
          data={tasks}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </DashboardLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  taskItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
    }),
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  taskStatus: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
    textTransform: 'uppercase',
  },
  taskPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
});

const enhance = withObservables([], () => ({
  tasks: database.collections.get<Task>('tasks').query(
    Q.sortBy('created_at', Q.desc)
  ),
}));

export default enhance(TasksScreen);
