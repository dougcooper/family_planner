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
