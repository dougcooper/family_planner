import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { User } from '../../model/models';

interface FamilyAssignmentSummaryProps {
  users: User[];
  counts: Record<string, number>;
  title?: string;
  onUserPress?: (user: User) => void;
  selectedUserIds?: string[];
}

export const FamilyAssignmentSummary = ({ users, counts, title = 'Assignments', onUserPress, selectedUserIds = [] }: FamilyAssignmentSummaryProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {users.map(user => {
          const isSelected = selectedUserIds.includes(user.id);
          return (
            <TouchableOpacity 
              key={user.id} 
              style={styles.userItem}
              onPress={() => onUserPress?.(user)}
              disabled={!onUserPress}
            >
              <View style={[styles.avatarContainer, isSelected && styles.avatarSelected]}>
                {user.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
                ) : (
                  <Text style={styles.avatarEmoji}>👤</Text>
                )}
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{counts[user.id] || 0}</Text>
                </View>
              </View>
              <Text style={[styles.userName, isSelected && styles.userNameSelected]} numberOfLines={1}>
                {user.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 16,
    marginBottom: 8,
  },
  scrollView: {
    paddingHorizontal: 12,
  },
  userItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 60,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 4,
    padding: 2,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarSelected: {
    borderColor: '#007AFF',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  avatarEmoji: {
    fontSize: 24,
    width: 40,
    height: 40,
    textAlign: 'center',
    lineHeight: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  userNameSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
