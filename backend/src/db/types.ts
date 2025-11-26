import { InferSelectModel } from 'drizzle-orm';
import { users, families, tasks, notifications, events, mealPlans, groceryItems, rewards, rewardClaims } from './schema.js';
import { 
  User as IUser, 
  Family as IFamily, 
  Task as ITask,
  Event as IEvent
} from '@family-planner/types';

// Infer Drizzle types
export type DrizzleUser = InferSelectModel<typeof users>;
export type DrizzleFamily = InferSelectModel<typeof families>;
export type DrizzleTask = InferSelectModel<typeof tasks>;
export type DrizzleNotification = InferSelectModel<typeof notifications>;
export type DrizzleEvent = InferSelectModel<typeof events>;
export type DrizzleMealPlan = InferSelectModel<typeof mealPlans>;
export type DrizzleGroceryItem = InferSelectModel<typeof groceryItems>;
export type DrizzleReward = InferSelectModel<typeof rewards>;
export type DrizzleRewardClaim = InferSelectModel<typeof rewardClaims>;

// Type assertions to ensure compatibility
// These are not executed, just checked by TypeScript
// If Drizzle schema diverges from shared types, this will error

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _checkUser = (d: DrizzleUser): IUser => {
  return {
    ...d,
    // Drizzle might return null for optional fields, interface might expect undefined
    // or specific enum types might need casting if Drizzle uses generic string/enum
    role: d.role as IUser['role'],
    emailFrequency: d.emailFrequency as IUser['emailFrequency'],
    email: d.email || undefined,
    passwordHash: d.passwordHash || undefined,
    avatarUrl: d.avatarUrl || undefined,
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _checkFamily = (d: DrizzleFamily): IFamily => d;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _checkTask = (d: DrizzleTask): ITask => {
  return {
    ...d,
    status: d.status as ITask['status'],
    description: d.description || undefined,
    dueDate: d.dueDate || undefined,
    recurrenceRule: d.recurrenceRule || undefined,
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _checkEvent = (d: DrizzleEvent): IEvent => {
  return {
    ...d,
    userId: d.userId || undefined,
    recurrenceRule: d.recurrenceRule || undefined,
    recurrenceId: d.recurrenceId || undefined,
  };
};
