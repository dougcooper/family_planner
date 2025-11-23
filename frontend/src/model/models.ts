import { Model, Query } from '@nozbe/watermelondb';
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators';
import type { 
  Family as IFamily, 
  User as IUser, 
  Notification as INotification, 
  Task as ITask, 
  Event as IEvent, 
  EventAttendee as IEventAttendee, 
  MealPlan as IMealPlan, 
  GroceryItem as IGroceryItem, 
  List as IList,
  ListItem as IListItem,
  Reward as IReward,
  UserRole,
  EmailFrequency,
  TaskStatus,
  MealType,
  NotificationType,
  ListType
} from '@family-planner/types';

export class Family extends Model implements IFamily {
  static table = 'families';

  @field('name') name!: string;
  @field('kiosk_timeout_seconds') kioskTimeoutSeconds!: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

export class User extends Model implements IUser {
  static table = 'users';

  @field('family_id') familyId!: string;
  @field('email') email?: string;
  @field('name') name!: string;
  @field('role') role!: UserRole;
  @field('pin_hash') pinHash!: string;
  @field('points_balance') pointsBalance!: number;
  @field('email_frequency') emailFrequency!: EmailFrequency;
  @field('avatar_url') avatarUrl?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  // Optional passwordHash from interface, not stored in frontend DB
  passwordHash?: string;
}

export class Notification extends Model implements INotification {
  static table = 'notifications';

  @field('user_id') userId!: string;
  @field('title') title!: string;
  @field('message') message!: string;
  @field('type') type!: NotificationType;
  @field('is_read') isRead!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

export class Task extends Model implements ITask {
  static table = 'tasks';

  @field('family_id') familyId!: string;
  @field('title') title!: string;
  @field('description') description?: string;
  @field('points') points!: number;
  @field('status') status!: TaskStatus;
  @date('due_date') dueDate?: Date;
  @field('recurrence_rule') recurrenceRule?: string;
  @field('assignee_id') assigneeId!: string;
  @field('creator_id') creatorId!: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

export class Event extends Model implements IEvent {
  static table = 'events';

  @field('family_id') familyId!: string;
  @field('title') title!: string;
  @date('start_time') startTime!: Date;
  @date('end_time') endTime!: Date;
  @field('recurrence_rule') recurrenceRule?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

export class EventAttendee extends Model implements IEventAttendee {
  static table = 'event_attendees';

  @field('event_id') eventId!: string;
  @field('user_id') userId!: string;
}

export class MealPlan extends Model implements IMealPlan {
  static table = 'meal_plans';

  @field('family_id') familyId!: string;
  @field('date') date!: string;
  @field('meal_type') mealType!: MealType;
  @field('description') description!: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

export class GroceryItem extends Model implements IGroceryItem {
  static table = 'grocery_items';

  @field('family_id') familyId!: string;
  @field('name') name!: string;
  @field('is_checked') isChecked!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

export class List extends Model implements IList {
  static table = 'lists';

  @field('family_id') familyId!: string;
  @field('name') name!: string;
  @field('type') type!: ListType;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('list_items') items!: Query<ListItem>;
}

export class ListItem extends Model implements IListItem {
  static table = 'list_items';

  @field('list_id') listId!: string;
  @field('text') text!: string;
  @field('is_checked') isChecked!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

export class Reward extends Model implements IReward {
  static table = 'rewards';

  @field('family_id') familyId!: string;
  @field('title') title!: string;
  @field('cost') cost!: number;
  @field('image_url') imageUrl?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
