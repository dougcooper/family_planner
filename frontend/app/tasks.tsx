import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Image, Switch } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../src/model/database';
import { Task, User } from '../src/model/models';
import { DashboardLayout } from '../src/components/dashboard/DashboardLayout';
import { TaskDetail } from '../src/components/tasks/TaskDetail';
import { CreateTaskModal } from '../src/components/tasks/CreateTaskModal';
import { FamilyAssignmentSummary } from '../src/components/common/FamilyAssignmentSummary';
import { authProvider } from '../src/logic/auth';

interface TaskListItemProps {
  task: Task;
  assignee: User;
  onPress: (task: Task) => void;
}

const TaskListItemComponent = ({ task, assignee, onPress }: TaskListItemProps) => (
  <TouchableOpacity onPress={() => onPress(task)}>
    <View style={styles.taskItem}>
      <View style={{ flex: 1 }}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <View style={styles.assigneeContainer}>
          {assignee?.avatarUrl ? (
            <Image source={{ uri: assignee.avatarUrl }} style={styles.avatar} />
          ) : (
            <Text style={styles.assigneeEmoji}>👤</Text>
          )}
          <Text style={styles.assigneeText}>
            {assignee ? assignee.name : 'Unassigned'}
          </Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.taskStatus}>{task.status.replace('_', ' ')}</Text>
        <Text style={styles.taskPoints}>{task.points} pts</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const enhanceTaskListItem = withObservables(['task'], ({ task }: { task: Task }) => ({
  task,
  assignee: task.assignee,
}));

const TaskListItem = enhanceTaskListItem(TaskListItemComponent);

interface TasksScreenProps {
  tasks: Task[];
  users: User[];
}

const TasksScreen = ({ tasks, users }: TasksScreenProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(authProvider.getState().user);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    const unsubscribe = authProvider.subscribe((state) => {
      setCurrentUser(state.user);
    });
    return unsubscribe;
  }, []);

  const filteredTasks = tasks.filter(task => 
    showCompleted ? true : task.status !== 'COMPLETED'
  );

  const taskCounts = tasks.reduce((acc, task) => {
    if (task.status !== 'COMPLETED') {
      const assigneeId = task.assigneeId;
      acc[assigneeId] = (acc[assigneeId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const renderItem = ({ item }: { item: Task }) => (
    <TaskListItem task={item} onPress={setSelectedTask} />
  );

  return (
    <DashboardLayout>
      <View style={styles.container}>
        <FamilyAssignmentSummary users={users} counts={taskCounts} title="Task Assignments" />
        <View style={styles.headerContainer}>
          <Text style={styles.header}>All Tasks</Text>
          <View style={styles.headerControls}>
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>Show Completed</Text>
              <Switch value={showCompleted} onValueChange={setShowCompleted} />
            </View>
            {currentUser?.role === 'PARENT' && (
              <TouchableOpacity onPress={() => setIsCreateModalVisible(true)} style={styles.addButton}>
                <Text style={styles.addButtonText}>+ New Task</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <FlatList
          data={filteredTasks}
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
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
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
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  assigneeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  assigneeEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  assigneeText: {
    fontSize: 12,
    color: '#64748B',
  },
  taskStatus: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  taskPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
});

const enhance = withObservables([], () => ({
  tasks: database.collections.get<Task>('tasks').query(
    Q.sortBy('status', Q.desc),
    Q.sortBy('created_at', Q.desc)
  ),
  users: database.collections.get<User>('users').query(),
}));

export default enhance(TasksScreen);
