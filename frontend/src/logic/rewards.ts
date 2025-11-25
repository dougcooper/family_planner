import { Database } from '@nozbe/watermelondb';
import { Reward, User, RewardClaim } from '../model/models';

/**
 * Reward redemption logic - handles point deduction and reward claiming
 */

export async function redeemReward(
  database: Database,
  userId: string,
  rewardId: string
): Promise<{ success: boolean; newBalance?: number; error?: string; claimId?: string }> {
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

    // Deduct points from user and create claim record
    const newBalance = user.pointsBalance - reward.cost;
    let claimId: string | undefined;
    
    await database.write(async () => {
      await user.update((u) => {
        u.pointsBalance = newBalance;
      });

      // Create a claim record
      const claim = await database.get<RewardClaim>('reward_claims').create((c) => {
        c.rewardId = reward.id;
        c.userId = user.id;
        c.pointsCost = reward.cost;
        c.status = 'ACTIVE';
        c.claimedAt = new Date();
      });
      claimId = claim.id;
    });

    return {
      success: true,
      newBalance,
      claimId,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error redeeming reward:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function unclaimReward(
  database: Database,
  claimId: string,
  approverId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the claim and approver
    const claim = await database.get<RewardClaim>('reward_claims').find(claimId);
    const approver = await database.get<User>('users').find(approverId);

    // Verify approver is a PARENT
    if (approver.role !== 'PARENT') {
      return {
        success: false,
        error: 'Only parents can approve reward unclaims',
      };
    }

    // Verify claim is active
    if (claim.status !== 'ACTIVE') {
      return {
        success: false,
        error: 'This reward has already been unclaimed',
      };
    }

    // Get the user who claimed the reward
    const user = await database.get<User>('users').find(claim.userId);

    // Refund points and update claim status
    await database.write(async () => {
      await user.update((u) => {
        u.pointsBalance = u.pointsBalance + claim.pointsCost;
      });

      await claim.update((c) => {
        c.status = 'UNCLAIMED';
        c.unclaimedAt = new Date();
        c.unclaimedBy = approverId;
      });
    });

    return {
      success: true,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error unclaiming reward:', error);
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
    // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
    console.error('Error checking if user can afford reward:', error);
    return false;
  }
}
