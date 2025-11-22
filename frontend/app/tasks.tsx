import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Platform, TouchableOpacity, Modal } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../src/model/database';
import { Task } from '../src/model/models';
import { DashboardLayout } from '../src/components/dashboard/DashboardLayout';
import { TaskDetail } from '../src/components/tasks/TaskDetail';
import { CreateTaskModal } from '../src/components/tasks/CreateTaskModal';
import { authProvider } from '../src/logic/auth';

interface TasksScreenProps {
  tasks: Task[];
}

const TasksScreen = ({ tasks }: TasksScreenProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(authProvider.getState().user);

  useEffect(() => {
    const unsubscribe = authProvider.subscribe((state) => {
      setCurrentUser(state.user);
    });
    return unsubscribe;
  }, []);

  const renderItem = ({ item }: { item: Task }) => (
    <TouchableOpacity onPress={() => setSelectedTask(item)}>
      <View style={styles.taskItem}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <Text style={styles.taskStatus}>{item.status}</Text>
        <Text style={styles.taskPoints}>{item.points} pts</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <DashboardLayout>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>All Tasks</Text>
          {currentUser?.role === 'PARENT' && (
            <TouchableOpacity onPress={() => setIsCreateModalVisible(true)} style={styles.addButton}>
              <Text style={styles.addButtonText}>+ New Task</Text>
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={tasks}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />

        <Modal
          visible={!!selectedTask}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedTask(null)}
        >
          {selectedTask && currentUser && (
            <TaskDetail
              task={selectedTask}
              database={database}
              currentUserId={currentUser.id}
              currentUserRole={currentUser.role as 'PARENT' | 'CHILD'}
              onClose={() => setSelectedTask(null)}
            />
          )}
        </Modal>

        {currentUser && (
          <CreateTaskModal
            visible={isCreateModalVisible}
            onClose={() => setIsCreateModalVisible(false)}
            database={database}
            currentUserId={currentUser.id}
            familyId={currentUser.familyId}
          />
        )}
      </View>
    </DashboardLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
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
