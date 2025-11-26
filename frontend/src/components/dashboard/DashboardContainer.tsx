import React from 'react';
import { View, StyleSheet } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../model/database';
import { DashboardLayout } from './DashboardLayout';
import { EventList } from './EventList';
import { TaskListSummary } from './TaskListSummary';
import { DailyMealsSummary } from './DailyMealsSummary';
import { Task, Event, MealPlan, MealLabel } from '../../model/models';
import { formatDateToYYYYMMDD, getStartOfDay, getEndOfDay } from '../../logic/date';

interface DashboardInputProps {
  familyId?: string;
  userId?: string;
}

interface DashboardContainerProps extends DashboardInputProps {
  tasks: Task[];
  events: Event[];
  mealPlans: MealPlan[];
  mealLabels: MealLabel[];
}

const DashboardContainer = ({ tasks, events, mealPlans, mealLabels }: DashboardContainerProps) => {
  return (
    <DashboardLayout>
      <EventList events={events} />
      
      <View style={styles.gridContainer}>
        <View style={styles.gridItem}>
          <TaskListSummary tasks={tasks} />
        </View>
        <View style={styles.gridItem}>
          <DailyMealsSummary mealPlans={mealPlans} mealLabels={mealLabels} />
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

  const mealLabelsQuery = database.collections.get<MealLabel>('meal_labels').query(
    Q.sortBy('sort_order', Q.asc)
  );

  return {
    tasks: database.collections.get<Task>('tasks').query(
      Q.sortBy('status', Q.desc),
      Q.sortBy('created_at', Q.desc)
    ),
    events: database.collections.get<Event>('events').query(
      Q.where('start_time', Q.gte(startOfDay)),
      Q.where('start_time', Q.lte(endOfDay)),
      Q.sortBy('start_time', Q.asc)
    ),
    mealPlans: mealQuery,
    mealLabels: mealLabelsQuery,
  };
});

export default enhance(DashboardContainer);
