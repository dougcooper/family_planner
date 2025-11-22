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

interface DashboardContainerProps {
  tasks: Task[];
  events: Event[];
  mealPlans: MealPlan[];
}

const DashboardContainer = ({ tasks, events, mealPlans }: DashboardContainerProps) => {
  const dinnerPlan = mealPlans.length > 0 ? mealPlans[0].description : null;

  return (
    <DashboardLayout>
      <TodayWidget 
        taskCount={tasks.length} 
        eventCount={events.length} 
        dinnerPlan={dinnerPlan} 
      />
      <EventList events={events} />
      <TaskListSummary tasks={tasks} />
      <DinnerSummary mealPlan={mealPlans[0] || null} />
    </DashboardLayout>
  );
};

const enhance = withObservables([], () => ({
  tasks: database.collections.get<Task>('tasks').query(
    Q.sortBy('created_at', Q.desc)
  ),
  events: database.collections.get<Event>('events').query(
    Q.sortBy('start_time', Q.asc)
  ),
  mealPlans: database.collections.get<MealPlan>('meal_plans').query(
    Q.sortBy('date', Q.desc)
  ),
}));

export default enhance(DashboardContainer);
