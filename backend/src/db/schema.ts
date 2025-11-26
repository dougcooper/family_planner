import { pgTable, uuid, varchar, timestamp, integer, boolean, pgEnum, date, text, unique } from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('user_role', ['PARENT', 'CHILD']);
export const emailFrequencyEnum = pgEnum('email_frequency', ['IMMEDIATE', 'DAILY', 'WEEKLY', 'OFF']);
export const notificationTypeEnum = pgEnum('notification_type', ['INFO', 'SUCCESS', 'WARNING', 'ERROR']);
export const taskStatusEnum = pgEnum('task_status', ['TODO', 'PENDING_REVIEW', 'COMPLETED']);
export const mealTypeEnum = pgEnum('meal_type', ['BREAKFAST', 'LUNCH', 'DINNER']);
export const listTypeEnum = pgEnum('list_type', ['GROCERY', 'TODO', 'OTHER']);

// Family table
export const families = pgTable('families', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  kioskTimeoutSeconds: integer('kiosk_timeout_seconds').notNull().default(120),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  name: varchar('name', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
  pinHash: varchar('pin_hash', { length: 255 }).notNull(),
  pointsBalance: integer('points_balance').notNull().default(0),
  emailFrequency: emailFrequencyEnum('email_frequency').notNull().default('DAILY'),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Invitations table
export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  message: varchar('message', { length: 1000 }).notNull(),
  type: notificationTypeEnum('type').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Tasks table
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  points: integer('points').notNull().default(0),
  status: taskStatusEnum('status').notNull().default('TODO'),
  dueDate: timestamp('due_date'),
  recurrenceRule: varchar('recurrence_rule', { length: 500 }),
  assigneeId: uuid('assignee_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  creatorId: uuid('creator_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Events table
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  recurrenceRule: varchar('recurrence_rule', { length: 500 }),
  recurrenceId: uuid('recurrence_id'), // Groups related recurring event instances
  isAllDay: boolean('is_all_day').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Event Attendees join table
export const eventAttendees = pgTable('event_attendees', {
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
});

// Meal Plans table
export const mealPlans = pgTable('meal_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  mealType: mealTypeEnum('meal_type').notNull(),
  description: varchar('description', { length: 500 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  unq: unique().on(t.familyId, t.date, t.mealType),
}));

// Grocery Items table
export const groceryItems = pgTable('grocery_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  isChecked: boolean('is_checked').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Lists table
export const lists = pgTable('lists', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: listTypeEnum('type').notNull().default('OTHER'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// List Items table
export const listItems = pgTable('list_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  listId: uuid('list_id').notNull().references(() => lists.id, { onDelete: 'cascade' }),
  text: varchar('text', { length: 255 }).notNull(),
  isChecked: boolean('is_checked').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Rewards table
export const rewards = pgTable('rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  cost: integer('cost').notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Recipes table
export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  ingredients: text('ingredients').notNull(), // JSON string
  instructions: text('instructions'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Reward Claims table - tracks when users claim rewards
export const rewardClaimStatusEnum = pgEnum('reward_claim_status', ['ACTIVE', 'UNCLAIMED']);

export const rewardClaims = pgTable('reward_claims', {
  id: uuid('id').primaryKey().defaultRandom(),
  rewardId: uuid('reward_id').notNull().references(() => rewards.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  pointsCost: integer('points_cost').notNull(), // Store cost at time of claim
  status: rewardClaimStatusEnum('status').notNull().default('ACTIVE'),
  claimedAt: timestamp('claimed_at').notNull().defaultNow(),
  unclaimedAt: timestamp('unclaimed_at'),
  unclaimedBy: uuid('unclaimed_by').references(() => users.id), // Parent who approved unclaim
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
