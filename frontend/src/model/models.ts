import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class Family extends Model {
  static table = 'families';

  @field('name') name!: string;
  @field('kiosk_timeout_seconds') kioskTimeoutSeconds!: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

export class User extends Model {
  static table = 'users';

  @field('family_id') familyId!: string;
  @field('email') email?: string;
  @field('name') name!: string;
  @field('role') role!: string;
  @field('pin_hash') pinHash!: string;
  @field('points_balance') pointsBalance!: number;
  @field('email_frequency') emailFrequency!: string;
  @field('avatar_url') avatarUrl?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

export class Notification extends Model {
  static table = 'notifications';

  @field('user_id') userId!: string;
  @field('title') title!: string;
  @field('message') message!: string;
  @field('type') type!: string;
  @field('is_read') isRead!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

export class Task extends Model {
  static table = 'tasks';

  @field('family_id') familyId!: string;
  @field('title') title!: string;
  @field('description') description?: string;
  @field('points') points!: number;
  @field('status') status!: string;
  @date('due_date') dueDate?: Date;
  @field('recurrence_rule') recurrenceRule?: string;
  @field('assignee_id') assigneeId!: string;
  @field('creator_id') creatorId!: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

export class Event extends Model {
  static table = 'events';

  @field('family_id') familyId!: string;
  @field('title') title!: string;
  @date('start_time') startTime!: Date;
  @date('end_time') endTime!: Date;
  @field('recurrence_rule') recurrenceRule?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

export class EventAttendee extends Model {
  static table = 'event_attendees';

  @field('event_id') eventId!: string;
  @field('user_id') userId!: string;
}

export class MealPlan extends Model {
  static table = 'meal_plans';

  @field('family_id') familyId!: string;
  @field('date') date!: string;
  @field('meal_type') mealType!: string;
  @field('description') description!: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

export class GroceryItem extends Model {
  static table = 'grocery_items';

  @field('family_id') familyId!: string;
  @field('name') name!: string;
  @field('is_checked') isChecked!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

export class Reward extends Model {
  static table = 'rewards';

  @field('family_id') familyId!: string;
  @field('title') title!: string;
  @field('cost') cost!: number;
  @field('image_url') imageUrl?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
