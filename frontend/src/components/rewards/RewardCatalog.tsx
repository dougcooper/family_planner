import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, TextInput, Alert, Platform, ScrollView } from 'react-native';
import { Database, Q } from '@nozbe/watermelondb';
import { withObservables } from '@nozbe/watermelondb/react';
import { Reward, User } from '../../model/models';
import { redeemReward } from '../../logic/rewards';

interface RewardCatalogProps {
  database: Database;
  user: User;
  rewards: Reward[];
  familyMembers: User[];
}

const RewardCatalogComponent = ({ database, user, rewards, familyMembers }: RewardCatalogProps) => {
  // Edit/Create Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const openModal = (reward?: Reward) => {
    if (reward) {
      setEditingReward(reward);
      setTitle(reward.title);
      setCost(reward.cost.toString());
      setImageUrl(reward.imageUrl || '');
    } else {
      setEditingReward(null);
      setTitle('');
      setCost('');
      setImageUrl('');
    }
    setModalVisible(true);
  };

  const handleSaveReward = async () => {
    if (!title.trim() || !cost.trim()) {
      alert('Please enter a title and cost');
      return;
    }

    const costNum = parseInt(cost, 10);
    if (isNaN(costNum) || costNum <= 0) {
      alert('Cost must be a positive number');
      return;
    }

    try {
      await database.write(async () => {
        if (editingReward) {
          await editingReward.update(r => {
            r.title = title.trim();
            r.cost = costNum;
            r.imageUrl = imageUrl.trim();
          });
        } else {
          await database.get<Reward>('rewards').create(r => {
            r.familyId = user.familyId;
            r.title = title.trim();
            r.cost = costNum;
            r.imageUrl = imageUrl.trim();
          });
        }
      });
      
      setModalVisible(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving reward:', error);
      alert('Failed to save reward');
    }
  };

  const handleDeleteReward = async (reward: Reward) => {
    const deleteAction = async () => {
      try {
        await database.write(async () => {
          await reward.markAsDeleted();
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error deleting reward:', error);
        alert('Failed to delete reward');
      }
    };

    if (Platform.OS === 'web') {
      if (confirm(`Delete "${reward.title}"?`)) {
        await deleteAction();
      }
    } else {
      Alert.alert(
        'Delete Reward',
        `Delete "${reward.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: deleteAction }
        ]
      );
    }
  };

  const handleRedeem = async (reward: Reward) => {
    if (user.pointsBalance < reward.cost) {
      alert(`Insufficient points! You need ${reward.cost} points but only have ${user.pointsBalance}.`);
      return;
    }

    const redeemAction = async () => {
      try {
        const result = await redeemReward(database, user.id, reward.id);
        
        if (result.success) {
          alert(`Successfully redeemed "${reward.title}"! Your new balance is ${result.newBalance} points.`);
        } else {
          alert(`Failed to redeem reward: ${result.error}`);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error redeeming reward:', error);
        alert('An error occurred while redeeming the reward');
      }
    };

    if (Platform.OS === 'web') {
      if (confirm(`Redeem "${reward.title}" for ${reward.cost} points?`)) {
        await redeemAction();
      }
    } else {
      Alert.alert(
        'Redeem Reward',
        `Redeem "${reward.title}" for ${reward.cost} points?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Redeem', onPress: redeemAction }
        ]
      );
    }
  };

  const canAfford = (cost: number) => {
    return user.pointsBalance >= cost;
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

            <View style={styles.adminActions}>
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={() => openModal(item)}
              >
                <Text style={styles.iconButtonText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={() => handleDeleteReward(item)}
              >
                <Text style={styles.iconButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderLeaderboard = () => (
    <View style={styles.leaderboardContainer}>
      <Text style={styles.leaderboardTitle}>Family Leaderboard 🏆</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.leaderboardList}>
        {familyMembers.map(member => (
          <View key={member.id} style={styles.leaderboardItem}>
            {member.avatarUrl ? (
              <Image 
                source={{ uri: member.avatarUrl }} 
                style={[
                  styles.avatarCircle,
                  member.id === user.id && styles.avatarCircleActive
                ]} 
              />
            ) : (
              <View style={[
                styles.avatarCircle,
                member.id === user.id && styles.avatarCircleActive
              ]}>
                <Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.memberName} numberOfLines={1}>
              {member.id === user.id ? 'You' : member.name}
            </Text>
            <Text style={styles.memberPoints}>{member.pointsBalance} pts</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Reward Catalog</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.balanceBadge}>
          <Text style={styles.balanceText}>💰 {user.pointsBalance} pts</Text>
        </View>
      </View>

      {renderLeaderboard()}

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

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingReward ? 'Edit Reward' : 'New Reward'}
            </Text>
            
            <TextInput
              style={styles.modalInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Reward Title"
            />

            <TextInput
              style={styles.modalInput}
              value={cost}
              onChangeText={setCost}
              placeholder="Cost (points)"
              keyboardType="numeric"
            />

            <TextInput
              style={styles.modalInput}
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="Image URL (optional)"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleSaveReward}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const enhanceFamilyData = withObservables(['user'], ({ user, database }: { user: User, database: Database }) => ({
  rewards: database.get<Reward>('rewards').query(
    Q.where('family_id', user.familyId),
    Q.sortBy('created_at', Q.desc)
  ).observe(),
  familyMembers: database.get<User>('users').query(
    Q.where('family_id', user.familyId),
    Q.sortBy('points_balance', Q.desc)
  ).observe(),
}));

const RewardCatalogWithData = enhanceFamilyData(RewardCatalogComponent);

const enhanceUser = withObservables(['currentUserId'], ({ database, currentUserId }: { database: Database, currentUserId: string }) => ({
  user: database.get<User>('users').findAndObserve(currentUserId),
}));

export const RewardCatalog = enhanceUser(({ user, database }: { user: User, database: Database }) => (
  <RewardCatalogWithData user={user} database={database} />
));

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
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
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
  adminActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  iconButton: {
    padding: 4,
  },
  iconButtonText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#F1F5F9',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  leaderboardContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  leaderboardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  leaderboardList: {
    paddingHorizontal: 12,
  },
  leaderboardItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 70,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  avatarCircleActive: {
    borderColor: '#4A90E2',
    backgroundColor: '#EBF8FF',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#475569',
  },
  memberName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  memberPoints: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
});
