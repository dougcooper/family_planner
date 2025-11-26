import React from 'react';
import { View, StyleSheet } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../model/database';
import { DashboardLayout } from './DashboardLayout';
import { TodayWidget } from './TodayWidget';
import { EventList } from './EventList';
import { TaskListSummary } from './TaskListSummary';
import { DailyMealsSummary } from './DailyMealsSummary';
import { ListsSummary } from './ListsSummary';
import { RewardsSummary } from './RewardsSummary';
import { Task, Event, MealPlan, List, User } from '../../model/models';
import { formatDateToYYYYMMDD, getStartOfDay, getEndOfDay } from '../../logic/date';

interface DashboardInputProps {
  familyId?: string;
  userId?: string;
}

interface DashboardContainerProps extends DashboardInputProps {
  tasks: Task[];
  events: Event[];
  mealPlans: MealPlan[];
  lists: List[];
  users: User[];
}

const DashboardContainer = ({ tasks, events, mealPlans, lists, users }: DashboardContainerProps) => {
  // Filter for dinner specifically for the widget summary
  const dinnerMeal = mealPlans.find(m => m.mealType === 'DINNER');
  const dinnerPlan = dinnerMeal ? dinnerMeal.description : null;
  
  return (
    <DashboardLayout>
      <TodayWidget 
        taskCount={tasks.length} 
        eventCount={events.length} 
        dinnerPlan={dinnerPlan} 
      />
      
      <EventList events={events} />
      
      <View style={styles.gridContainer}>
        <View style={styles.gridItem}>
          <TaskListSummary tasks={tasks} />
        </View>
        <View style={styles.gridItem}>
          <DailyMealsSummary mealPlans={mealPlans} />
        </View>
        <View style={styles.gridItem}>
          <ListsSummary lists={lists} />
        </View>
        <View style={styles.gridItem}>
          <RewardsSummary users={users} />
        </View>
      </View>
    </DashboardLayout>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8, // Negative margin to offset padding
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 0, // Components have their own bottom margin
  },
});

const enhance = withObservables(['familyId', 'userId'], ({ familyId }: DashboardInputProps) => {
  const todayStr = formatDateToYYYYMMDD(new Date());
  const startOfDay = getStartOfDay();
  const endOfDay = getEndOfDay();
  
  const mealQuery = familyId 
    ? database.collections.get<MealPlan>('meal_plans').query(
        Q.where('family_id', familyId),
        Q.where('date', todayStr),
        Q.sortBy('updated_at', Q.desc)
      )
    : database.collections.get<MealPlan>('meal_plans').query(
        Q.where('date', todayStr),
        Q.sortBy('updated_at', Q.desc)
      );

  const listQuery = familyId
    ? database.collections.get<List>('lists').query(
        Q.where('family_id', familyId),
        Q.sortBy('updated_at', Q.desc)
      )
    : database.collections.get<List>('lists').query(
        Q.sortBy('updated_at', Q.desc)
      );

  // userId is used here to potentially filter users if needed, but currently we want all users for the leaderboard.
  // However, the linter complains it's unused. 
  // If we want to show the current user differently, we might use it.
  // For now, let's just use it in the query or remove it if not needed.
  // The prompt asked for "points for each family member", so we need all users.
  // But we might want to highlight the current user.
  // Let's keep it simple and just remove it from the destructuring if it's truly not used, 
  // OR use it to observe the specific user if we were showing "My Rewards".
  // But we switched to "Leaderboard".
  
  // Wait, the previous code had:
  // const userQuery = userId
  //   ? database.collections.get<User>('users').findAndObserve(userId)
  //   : null;
  
  // And I changed it to:
  // const usersQuery = familyId ...
  
  // So userId is indeed unused in the new logic.
  // But `withObservables` needs to know about props that trigger re-observation.
  // If `userId` changes, do we need to re-run? Probably not for the leaderboard.
  // But `familyId` definitely.
  
  // I will remove `userId` from the destructuring if I can, or prefix with `_`.
  
  const usersQuery = familyId
    ? database.collections.get<User>('users').query(
        Q.where('family_id', familyId),
        Q.sortBy('points_balance', Q.desc)
      )
    : database.collections.get<User>('users').query(
        Q.sortBy('points_balance', Q.desc)
      );

  return {
    tasks: database.collections.get<Task>('tasks').query(
      Q.sortBy('created_at', Q.desc)
    ),
    events: database.collections.get<Event>('events').query(
      Q.where('start_time', Q.gte(startOfDay)),
      Q.where('start_time', Q.lte(endOfDay)),
      Q.sortBy('start_time', Q.asc)
    ),
    mealPlans: mealQuery,
    lists: listQuery,
    users: usersQuery,
  };
});

export default enhance(DashboardContainer);
