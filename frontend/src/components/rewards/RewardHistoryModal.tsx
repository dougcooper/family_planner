import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, Alert, Platform } from 'react-native';
import { Database, Q } from '@nozbe/watermelondb';
import { RewardClaim, User, Reward } from '../../model/models';
import { unclaimReward } from '../../logic/rewards';

interface RewardHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  database: Database;
  targetUser: User;
  currentUser: User;
}

interface ClaimWithReward {
  claim: RewardClaim;
  reward: Reward;
}

export const RewardHistoryModal = ({ 
  visible, 
  onClose, 
  database, 
  targetUser, 
  currentUser,
}: RewardHistoryModalProps) => {
  const [processing, setProcessing] = useState<string | null>(null);
  const [claimsWithRewards, setClaimsWithRewards] = useState<ClaimWithReward[]>([]);

  useEffect(() => {
    if (!visible) return;

    const subscription = database.get<RewardClaim>('reward_claims')
      .query(
        Q.where('user_id', targetUser.id),
        Q.sortBy('claimed_at', Q.desc)
      )
      .observe()
      .subscribe(async (claims) => {
        // Fetch rewards for each claim
        const claimsWithRewardsData = await Promise.all(
          claims.map(async (claim) => {
            const reward = await claim.reward.fetch();
            return { claim, reward };
          })
        );
        setClaimsWithRewards(claimsWithRewardsData);
      });

    return () => subscription.unsubscribe();
  }, [visible, targetUser.id, database]);

  const handleUnclaim = async (claim: RewardClaim, reward: Reward) => {
    if (currentUser.role !== 'PARENT') {
      alert('Only parents can approve reward unclaims');
      return;
    }
    
    const unclaimAction = async () => {
      setProcessing(claim.id);
      try {
        const result = await unclaimReward(database, claim.id, currentUser.id);
        
        if (result.success) {
          alert(`Successfully unclaimed "${reward.title}"! ${claim.pointsCost} points have been refunded.`);
        } else {
          alert(`Failed to unclaim reward: ${result.error}`);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error unclaiming reward:', error);
        alert('An error occurred while unclaiming the reward');
      } finally {
        setProcessing(null);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm(`Unclaim "${reward.title}" and refund ${claim.pointsCost} points to ${targetUser.name}?`)) {
        await unclaimAction();
      }
    } else {
      Alert.alert(
        'Unclaim Reward',
        `Unclaim "${reward.title}" and refund ${claim.pointsCost} points to ${targetUser.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Unclaim', style: 'destructive', onPress: unclaimAction }
        ]
      );
    }
  };

  const renderClaim = ({ item }: { item: ClaimWithReward }) => {
    const { claim, reward } = item;
    const isActive = claim.status === 'ACTIVE';
    const claimedDate = new Date(claim.claimedAt).toLocaleDateString();
    const unclaimedDate = claim.unclaimedAt ? new Date(claim.unclaimedAt).toLocaleDateString() : null;

    return (
      <View style={[styles.claimCard, !isActive && styles.claimCardUnclaimed]}>
        <View style={styles.claimHeader}>
          <Text style={styles.rewardTitle}>{reward.title}</Text>
          <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusUnclaimed]}>
            <Text style={styles.statusText}>{isActive ? 'Active' : 'Unclaimed'}</Text>
          </View>
        </View>
        
        <View style={styles.claimDetails}>
          <Text style={styles.detailText}>💰 {claim.pointsCost} points</Text>
          <Text style={styles.detailText}>📅 Claimed: {claimedDate}</Text>
          {unclaimedDate && (
            <Text style={styles.detailText}>↩️ Unclaimed: {unclaimedDate}</Text>
          )}
        </View>

        {isActive && currentUser.role === 'PARENT' && (
          <TouchableOpacity
            style={[styles.unclaimButton, processing === claim.id && styles.unclaimButtonDisabled]}
            onPress={() => handleUnclaim(claim, reward)}
            disabled={processing === claim.id}
          >
            <Text style={styles.unclaimButtonText}>
              {processing === claim.id ? 'Processing...' : 'Unclaim & Refund'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {targetUser.id === currentUser.id ? 'My' : `${targetUser.name}'s`} Reward History
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {claimsWithRewards.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎁</Text>
              <Text style={styles.emptyText}>No rewards claimed yet</Text>
              <Text style={styles.emptySubtext}>
                Start earning points to claim your first reward!
              </Text>
            </View>
          ) : (
            <FlatList
              data={claimsWithRewards}
              renderItem={renderClaim}
              keyExtractor={(item) => item.claim.id}
              contentContainerStyle={styles.claimsList}
            />
          )}

          {currentUser.role === 'PARENT' && claimsWithRewards.some(c => c.claim.status === 'ACTIVE') && (
            <View style={styles.parentNote}>
              <Text style={styles.parentNoteText}>
                ℹ️ As a parent, you can unclaim active rewards to refund points
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 600,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#64748B',
    fontWeight: '600',
  },
  claimsList: {
    gap: 12,
  },
  claimCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  claimCardUnclaimed: {
    opacity: 0.6,
    borderColor: '#CBD5E1',
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusUnclaimed: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  claimDetails: {
    gap: 6,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#64748B',
  },
  unclaimButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  unclaimButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  unclaimButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
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
  parentNote: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  parentNoteText: {
    fontSize: 12,
    color: '#1E40AF',
  },
});
