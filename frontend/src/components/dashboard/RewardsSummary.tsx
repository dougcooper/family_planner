import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User } from '../../model/models';

interface RewardsSummaryProps {
  users: User[];
}

export function RewardsSummary({ users }: RewardsSummaryProps) {
  // Sort users by points descending
  const sortedUsers = [...users].sort((a, b) => b.pointsBalance - a.pointsBalance);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Leaderboard</Text>
      <View style={styles.listContainer}>
        {sortedUsers.map((user) => (
          <View key={user.id} style={styles.userRow}>
            <View style={styles.userInfo}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
            </View>
            <View style={styles.pointsContainer}>
              <Text style={styles.pointsValue}>{user.pointsBalance}</Text>
              <Text style={styles.pointsLabel}>PTS</Text>
            </View>
          </View>
        ))}
        {users.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No family members yet</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
    flex: 1,
    minWidth: '45%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  listContainer: {
    gap: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
  userName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F57F17',
  },
  pointsLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F9A825',
  },
  emptyState: {
    alignItems: 'center',
    padding: 8,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
});
