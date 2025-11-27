import { Model, Query, Relation } from '@nozbe/watermelondb';
import { field, date, readonly, children, relation } from '@nozbe/watermelondb/decorators';
import type { 
  Family as IFamily, 
  User as IUser, 
  Notification as INotification, 
  Task as ITask, 
  Event as IEvent, 
  EventAttendee as IEventAttendee, 
  MealPlan as IMealPlan, 
  MealLabel as IMealLabel,
  GroceryItem as IGroceryItem, 
  List as IList,
  ListItem as IListItem,
  Reward as IReward,
  Recipe as IRecipe,
  RewardClaim as IRewardClaim,
  UserRole,
  EmailFrequency,
  TaskStatus,
  MealType,
  NotificationType,
  ListType,
  RewardClaimStatus
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
  @field('color') color?: string;
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

  @relation('users', 'assignee_id') assignee!: Relation<User>;
}

export class Event extends Model implements IEvent {
  static table = 'events';

  @field('family_id') familyId!: string;
  @field('user_id') userId?: string;
  @field('title') title!: string;
  @date('start_time') startTime!: Date;
  @date('end_time') endTime!: Date;
  @field('recurrence_rule') recurrenceRule?: string;
  @field('recurrence_id') recurrenceId?: string;
  @field('is_all_day') isAllDay!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation('users', 'user_id') user!: Relation<User>;
}

export class EventAttendee extends Model implements IEventAttendee {
  static table = 'event_attendees';

  @field('event_id') eventId!: string;
  @field('user_id') userId!: string;
}

export class MealLabel extends Model implements IMealLabel {
  static table = 'meal_labels';

  @field('family_id') familyId!: string;
  @field('name') name!: string;
  @field('sort_order') sortOrder!: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

export class MealPlan extends Model implements IMealPlan {
  static table = 'meal_plans';
  static associations = {
    recipes: { type: 'belongs_to', key: 'recipe_id' },
    meal_labels: { type: 'belongs_to', key: 'meal_label_id' },
  } as const;

  @field('family_id') familyId!: string;
  @field('date') date!: string;
  @field('meal_type') mealType?: MealType;
  @field('meal_label_id') mealLabelId?: string;
  @field('description') description!: string;
  @field('recipe_id') recipeId?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation('recipes', 'recipe_id') recipe!: Relation<Recipe>;
  @relation('meal_labels', 'meal_label_id') mealLabel!: Relation<MealLabel>;
}

export class Recipe extends Model implements IRecipe {
  static table = 'recipes';

  @field('family_id') familyId!: string;
  @field('name') name!: string;
  @field('description') description?: string;
  @field('ingredients') _ingredients!: string;
  @field('instructions') instructions?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  get ingredients(): string[] {
    try {
      return JSON.parse(this._ingredients);
    } catch {
      return [];
    }
  }

  set ingredients(value: string[]) {
    this._ingredients = JSON.stringify(value);
  }
}

export class GroceryItem extends Model implements IGroceryItem {
  static table = 'grocery_items';

  @field('family_id') familyId!: string;
  @field('name') name!: string;
  @field('is_checked') isChecked!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

export class ListItem extends Model implements IListItem {
  static table = 'list_items';
  static associations = {
    lists: { type: 'belongs_to', key: 'list_id' },
    users: { type: 'belongs_to', key: 'assignee_id' },
  } as const;

  @field('list_id') listId!: string;
  @field('text') text!: string;
  @field('is_checked') isChecked!: boolean;
  @field('assignee_id') assigneeId?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation('users', 'assignee_id') assignee!: Relation<User>;
}

export class List extends Model implements IList {
  static table = 'lists';
  static associations = {
    list_items: { type: 'has_many', foreignKey: 'list_id' },
  } as const;

  @field('family_id') familyId!: string;
  @field('name') name!: string;
  @field('type') type!: ListType;
  @field('is_archived') isArchived!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('list_items') items!: Query<ListItem>;
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

export class RewardClaim extends Model implements IRewardClaim {
  static table = 'reward_claims';

  @field('reward_id') rewardId!: string;
  @field('user_id') userId!: string;
  @field('points_cost') pointsCost!: number;
  @field('status') status!: RewardClaimStatus;
  @date('claimed_at') claimedAt!: Date;
  @date('unclaimed_at') unclaimedAt?: Date;
  @field('unclaimed_by') unclaimedBy?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation('rewards', 'reward_id') reward!: Relation<Reward>;
  @relation('users', 'user_id') user!: Relation<User>;
}
