// Enums
export type UserRole = 'PARENT' | 'CHILD';
export type TaskStatus = 'TODO' | 'PENDING_REVIEW' | 'COMPLETED';
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER';
export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
export type EmailFrequency = 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | 'OFF';
export type ListType = 'GROCERY' | 'TODO' | 'OTHER';
export type RewardClaimStatus = 'ACTIVE' | 'UNCLAIMED';

// Entity Interfaces
export interface Family {
  id: string;
  name: string;
  kioskTimeoutSeconds: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  familyId: string;
  email?: string;
  passwordHash?: string;
  name: string;
  role: UserRole;
  pinHash: string;
  pointsBalance: number;
  emailFrequency: EmailFrequency;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invitation {
  id: string;
  familyId: string;
  email: string;
  role: UserRole;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  familyId: string;
  title: string;
  description?: string;
  points: number;
  status: TaskStatus;
  dueDate?: Date;
  recurrenceRule?: string;
  assigneeId: string;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  familyId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  recurrenceRule?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventAttendee {
  eventId: string;
  userId: string;
}

export interface MealPlan {
  id: string;
  familyId: string;
  date: string; // YYYY-MM-DD format
  mealType: MealType;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroceryItem {
  id: string;
  familyId: string;
  name: string;
  isChecked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Recipe {
  id: string;
  familyId: string;
  name: string;
  description?: string;
  ingredients: string[];
  instructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface List {
  id: string;
  familyId: string;
  name: string;
  type: ListType;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListItem {
  id: string;
  listId: string;
  text: string;
  isChecked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reward {
  id: string;
  familyId: string;
  title: string;
  cost: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RewardClaim {
  id: string;
  rewardId: string;
  userId: string;
  pointsCost: number;
  status: RewardClaimStatus;
  claimedAt: Date;
  unclaimedAt?: Date;
  unclaimedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
