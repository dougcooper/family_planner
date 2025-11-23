import React from 'react';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../model/database';
import { DashboardLayout } from './DashboardLayout';
import { TodayWidget } from './TodayWidget';
import { EventList } from './EventList';
import { TaskListSummary } from './TaskListSummary';
import { DinnerSummary } from './DinnerSummary';
import { Task, Event, MealPlan } from '../../model/models';
import { formatDateToYYYYMMDD } from '../../logic/date';

interface DashboardInputProps {
  familyId?: string;
}

interface DashboardContainerProps extends DashboardInputProps {
  tasks: Task[];
  events: Event[];
  mealPlans: MealPlan[];
}

const DashboardContainer = ({ tasks, events, mealPlans }: DashboardContainerProps) => {
  // Filter for dinner specifically, in case the query returns multiple types
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
      <TaskListSummary tasks={tasks} />
      <DinnerSummary mealPlan={dinnerMeal || null} />
    </DashboardLayout>
  );
};

const enhance = withObservables(['familyId'], ({ familyId }: DashboardInputProps) => {
  const todayStr = formatDateToYYYYMMDD(new Date());
  
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

  return {
    tasks: database.collections.get<Task>('tasks').query(
      Q.sortBy('created_at', Q.desc)
    ),
    events: database.collections.get<Event>('events').query(
      Q.sortBy('start_time', Q.asc)
    ),
    mealPlans: mealQuery,
  };
});

export default enhance(DashboardContainer);
