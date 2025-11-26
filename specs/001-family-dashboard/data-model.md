# Data Model: Family Dashboard

## Entities

### Family
Represents the household unit.
- `id`: UUID (PK)
- `name`: String
- `kiosk_timeout_seconds`: Integer (default 120)
- `created_at`: Timestamp
- `updated_at`: Timestamp (for sync)

### User
Represents a family member.
- `id`: UUID (PK)
- `family_id`: UUID (FK -> Family)
- `email`: String (optional, unique)
- `password_hash`: String (optional, for Parents)
- `name`: String
- `role`: Enum (PARENT, CHILD)
- `pin_hash`: String (hashed 4-digit PIN)
- `points_balance`: Integer (default 0)
- `email_frequency`: Enum (IMMEDIATE, DAILY, WEEKLY, OFF) (default DAILY)
- `avatar_url`: String (optional)
- `created_at`: Timestamp
- `updated_at`: Timestamp (for sync)

### Invitation
Pending invite for a new family member.
- `id`: UUID (PK)
- `family_id`: UUID (FK -> Family)
- `email`: String
- `role`: Enum (PARENT)
- `token`: String (unique)
- `expires_at`: Timestamp
- `created_at`: Timestamp

### Notification
In-app alerts for users.
- `id`: UUID (PK)
- `user_id`: UUID (FK -> User)
- `title`: String
- `message`: String
- `type`: Enum (INFO, SUCCESS, WARNING, ERROR)
- `is_read`: Boolean (default false)
- `created_at`: Timestamp
- `updated_at`: Timestamp (for sync)

### Task
A chore or activity assigned to a user.
- `id`: UUID (PK)
- `family_id`: UUID (FK -> Family)
- `title`: String
- `description`: String (optional)
- `points`: Integer
- `status`: Enum (TODO, PENDING_REVIEW, COMPLETED)
- `due_date`: Timestamp (optional)
- `recurrence_rule`: String (RRule format, optional)
- `assignee_id`: UUID (FK -> User)
- `creator_id`: UUID (FK -> User)
- `created_at`: Timestamp
- `updated_at`: Timestamp (for sync)

### Event
Calendar event.
- `id`: UUID (PK)
- `family_id`: UUID (FK -> Family)
- `user_id`: UUID (FK -> User, optional)
- `title`: String
- `start_time`: Timestamp
- `end_time`: Timestamp
- `recurrence_rule`: String (RRule format, optional)
- `recurrence_id`: UUID (optional, groups related instances)
- `is_all_day`: Boolean (default false)
- `created_at`: Timestamp
- `updated_at`: Timestamp (for sync)

### EventAttendee
Join table for Event <-> User.
- `event_id`: UUID (FK -> Event)
- `user_id`: UUID (FK -> User)

### MealLabel
Configurable labels for meals (e.g., Breakfast, Lunch, Dinner, Snack).
- `id`: UUID (PK)
- `family_id`: UUID (FK -> Family)
- `name`: String
- `sort_order`: Integer
- `created_at`: Timestamp
- `updated_at`: Timestamp (for sync)

### Recipe
Stored recipes with ingredients and instructions.
- `id`: UUID (PK)
- `family_id`: UUID (FK -> Family)
- `name`: String
- `description`: String (optional)
- `ingredients`: String (JSON)
- `instructions`: String (optional)
- `created_at`: Timestamp
- `updated_at`: Timestamp (for sync)

### MealPlan
Daily meal entry.
- `id`: UUID (PK)
- `family_id`: UUID (FK -> Family)
- `date`: Date (YYYY-MM-DD)
- `meal_label_id`: UUID (FK -> MealLabel)
- `description`: String
- `recipe_id`: UUID (FK -> Recipe, optional)
- `created_at`: Timestamp
- `updated_at`: Timestamp (for sync)

### List
Container for list items (Grocery, Todo, etc.).
- `id`: UUID (PK)
- `family_id`: UUID (FK -> Family)
- `name`: String
- `type`: Enum (GROCERY, TODO, OTHER)
- `is_archived`: Boolean (default false)
- `created_at`: Timestamp
- `updated_at`: Timestamp (for sync)

### ListItem
Item within a list.
- `id`: UUID (PK)
- `list_id`: UUID (FK -> List)
- `text`: String
- `is_checked`: Boolean (default false)
- `assignee_id`: UUID (FK -> User, optional)
- `created_at`: Timestamp
- `updated_at`: Timestamp (for sync)

### GroceryItem
Legacy table for shared shopping list items (kept for backward compatibility or specific use).
- `id`: UUID (PK)
- `family_id`: UUID (FK -> Family)
- `name`: String
- `is_checked`: Boolean (default false)
- `created_at`: Timestamp
- `updated_at`: Timestamp (for sync)

### Reward
Redeemable item for points.
- `id`: UUID (PK)
- `family_id`: UUID (FK -> Family)
- `title`: String
- `cost`: Integer
- `image_url`: String (optional)
- `created_at`: Timestamp
- `updated_at`: Timestamp (for sync)

### RewardClaim
Tracked claim of a reward by a user.
- `id`: UUID (PK)
- `reward_id`: UUID (FK -> Reward)
- `user_id`: UUID (FK -> User)
- `points_cost`: Integer (cost at time of claim)
- `status`: Enum (ACTIVE, UNCLAIMED)
- `claimed_at`: Timestamp
- `unclaimed_at`: Timestamp (optional)
- `unclaimed_by`: UUID (FK -> User, optional)
- `created_at`: Timestamp
- `updated_at`: Timestamp (for sync)
- `created_at`: Timestamp
- `updated_at`: Timestamp (for sync)

### Recipe
A reusable meal definition.
- `id`: UUID (PK)
- `family_id`: UUID (FK -> Family)
- `name`: String
- `description`: String (optional)
- `ingredients`: String (JSON array of strings)
- `instructions`: String (optional)
- `created_at`: Timestamp
- `updated_at`: Timestamp (for sync)

## Relationships

- **Family** has many **Users**
- **User** belongs to **Family**
- **User** has many **Tasks** (as assignee)
- **User** has many **Events** (as attendee)
- **User** has many **Notifications**
- **Task** belongs to **User** (assignee)
- **Event** has many **Users** (attendees)

## Sync Considerations
All entities must include `created_at` and `updated_at` timestamps to support WatermelonDB's "changes since" synchronization protocol. Soft deletes (e.g., `deleted_at`) should be implemented for all syncable entities.
