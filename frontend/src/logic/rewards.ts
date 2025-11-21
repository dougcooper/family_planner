import { Database } from '@nozbe/watermelondb';
import { Reward, User } from '../model/models';

/**
 * Reward redemption logic - handles point deduction and reward claiming
 */

export async function redeemReward(
  database: Database,
  userId: string,
  rewardId: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    // Get the user and reward
    const user = await database.get<User>('users').find(userId);
    const reward = await database.get<Reward>('rewards').find(rewardId);

    // Check if user has enough points
    if (user.pointsBalance < reward.cost) {
      return {
        success: false,
        error: `Insufficient points. Required: ${reward.cost}, Available: ${user.pointsBalance}`,
      };
    }

    // Deduct points from user
    const newBalance = user.pointsBalance - reward.cost;
    
    await database.write(async () => {
      await user.update((u) => {
        u.pointsBalance = newBalance;
      });
    });

    return {
      success: true,
      newBalance,
    };
  } catch (error) {
    console.error('Error redeeming reward:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function getUserPointsBalance(
  database: Database,
  userId: string
): Promise<number> {
  try {
    const user = await database.get<User>('users').find(userId);
    return user.pointsBalance;
  } catch (error) {
    console.error('Error getting user points balance:', error);
    return 0;
  }
}

export async function canAffordReward(
  database: Database,
  userId: string,
  rewardId: string
): Promise<boolean> {
  try {
    const user = await database.get<User>('users').find(userId);
    const reward = await database.get<Reward>('rewards').find(rewardId);
    return user.pointsBalance >= reward.cost;
  } catch (error) {
    console.error('Error checking if user can afford reward:', error);
    return false;
  }
}
