import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Database, Q } from '@nozbe/watermelondb';
import { Reward, User } from '../../model/models';
import { redeemReward } from '../../logic/rewards';

interface RewardCatalogProps {
  database: Database;
  currentUserId: string;
}

export function RewardCatalog({ database, currentUserId }: RewardCatalogProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      // Load current user
      const user = await database.get<User>('users').find(currentUserId);
      setCurrentUser(user);

      // Load all rewards for the family
      const rewardsList = await database
        .get<Reward>('rewards')
        .query(Q.where('family_id', user.familyId))
        .fetch();
      
      setRewards(rewardsList);
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward: Reward) => {
    if (!currentUser) return;

    if (currentUser.pointsBalance < reward.cost) {
      alert(`Insufficient points! You need ${reward.cost} points but only have ${currentUser.pointsBalance}.`);
      return;
    }

    const confirmed = confirm(`Redeem "${reward.title}" for ${reward.cost} points?`);
    if (!confirmed) return;

    try {
      const result = await redeemReward(database, currentUserId, reward.id);
      
      if (result.success) {
        alert(`Successfully redeemed "${reward.title}"! Your new balance is ${result.newBalance} points.`);
        await loadData(); // Refresh user data to show updated balance
      } else {
        alert(`Failed to redeem reward: ${result.error}`);
      }
    } catch (error) {
      console.error('Error redeeming reward:', error);
      alert('An error occurred while redeeming the reward');
    }
  };

  const canAfford = (cost: number) => {
    return currentUser ? currentUser.pointsBalance >= cost : false;
  };

  const renderReward = ({ item }: { item: Reward }) => {
    const affordable = canAfford(item.cost);

    return (
      <View style={styles.rewardCard}>
        {item.imageUrl ? (
          <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.rewardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.rewardImagePlaceholder}>
            <Text style={styles.rewardImagePlaceholderText}>🎁</Text>
          </View>
        )}
        
        <View style={styles.rewardContent}>
          <Text style={styles.rewardTitle}>{item.title}</Text>
          
          <View style={styles.rewardFooter}>
            <View style={styles.costBadge}>
              <Text style={styles.costText}>{item.cost} pts</Text>
            </View>
            
            <TouchableOpacity
              style={[
                styles.redeemButton,
                !affordable && styles.redeemButtonDisabled
              ]}
              onPress={() => handleRedeem(item)}
              disabled={!affordable}
            >
              <Text style={[
                styles.redeemButtonText,
                !affordable && styles.redeemButtonTextDisabled
              ]}>
                {affordable ? 'Redeem' : 'Not enough points'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading rewards...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reward Catalog</Text>
        {currentUser && (
          <View style={styles.balanceBadge}>
            <Text style={styles.balanceText}>💰 {currentUser.pointsBalance} pts</Text>
          </View>
        )}
      </View>

      {rewards.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎁</Text>
          <Text style={styles.emptyText}>No rewards available yet</Text>
          <Text style={styles.emptySubtext}>Check back later for new rewards!</Text>
        </View>
      ) : (
        <FlatList
          data={rewards}
          renderItem={renderReward}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          numColumns={2}
          columnWrapperStyle={styles.row}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  balanceBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  balanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#64748B',
  },
  list: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  rewardCard: {
    flex: 1,
    maxWidth: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rewardImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#E2E8F0',
  },
  rewardImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardImagePlaceholderText: {
    fontSize: 48,
  },
  rewardContent: {
    padding: 12,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  rewardFooter: {
    gap: 8,
  },
  costBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  costText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  redeemButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  redeemButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
  redeemButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  redeemButtonTextDisabled: {
    color: '#94A3B8',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});
