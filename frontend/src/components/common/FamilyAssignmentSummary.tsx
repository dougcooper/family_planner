import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { User } from '../../model/models';

const USER_COLORS = [
  '#EF5350', '#EC407A', '#AB47BC', '#7E57C2', '#5C6BC0',
  '#42A5F5', '#29B6F6', '#26C6DA', '#26A69A', '#66BB6A',
  '#9CCC65', '#D4E157', '#FFEE58', '#FFCA28', '#FFA726',
  '#FF7043', '#8D6E63', '#BDBDBD', '#78909C'
];

const getUserColor = (user: User) => {
  if (user.color) return user.color;
  
  let hash = 0;
  for (let i = 0; i < user.id.length; i++) {
    hash = user.id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
};

interface FamilyAssignmentSummaryProps {
  users: User[];
  counts: Record<string, number>;
  title?: string;
  onUserPress?: (user: User) => void;
  selectedUserIds?: string[];
  vertical?: boolean;
}

export const FamilyAssignmentSummary = ({ users, counts, title = 'Assignments', onUserPress, selectedUserIds = [], vertical = false }: FamilyAssignmentSummaryProps) => {
  return (
    <View style={[styles.container, vertical && styles.containerVertical]}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView 
        horizontal={!vertical} 
        showsHorizontalScrollIndicator={false} 
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={vertical ? styles.verticalContent : styles.horizontalContent}
      >
        {users.map(user => {
          const isSelected = selectedUserIds.includes(user.id);
          const userColor = getUserColor(user);
          return (
            <TouchableOpacity 
              key={user.id} 
              style={[styles.userItem, vertical && styles.userItemVertical]}
              onPress={() => onUserPress?.(user)}
              disabled={!onUserPress}
            >
              <View style={[styles.avatarContainer, isSelected && styles.avatarSelected, { borderColor: userColor, borderWidth: 2 }]}>
                {user.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
                ) : (
                  <Text style={styles.avatarEmoji}>👤</Text>
                )}
                <View style={[styles.badge, { backgroundColor: userColor }]}>
                  <Text style={styles.badgeText}>{counts[user.id] || 0}</Text>
                </View>
              </View>
              <Text style={[styles.userName, vertical && styles.userNameVertical, isSelected && styles.userNameSelected]} numberOfLines={1}>
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
  containerVertical: {
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
    paddingVertical: 0,
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
  horizontalContent: {
    paddingRight: 20,
  },
  verticalContent: {
    paddingBottom: 20,
  },
  userItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 60,
  },
  userItemVertical: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginHorizontal: 0,
    marginBottom: 12,
    paddingHorizontal: 4,
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
  userNameVertical: {
    textAlign: 'left',
    marginLeft: 12,
    fontSize: 14,
  },
  userNameSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
