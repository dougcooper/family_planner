import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut, Settings, User as UserIcon } from 'lucide-react-native';
import { authProvider } from '../../logic/auth';
import { User } from '../../model/models';
import { database } from '../../model/database';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import log from '../../utils/logger';

export const UserMenu = () => {
  const [user, setUser] = useState<User | null>(null);
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadUser = async (userId: string) => {
      try {
        const userRecord = await database.get<User>('users').find(userId);
        setUser(userRecord);
      } catch (e) {
        log.info('Could not load user details', e);
      }
    };

    const authState = authProvider.getState();
    if (authState.user) {
      loadUser(authState.user.id);
    }

    const unsubscribe = authProvider.subscribe((state) => {
      if (state.user) {
        loadUser(state.user.id);
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    setVisible(false);
    await authProvider.logout();
  };

  const handleSettings = () => {
    setVisible(false);
    router.push('/settings');
  };

  // Calculate top position based on safe area and header approximation
  // Header is usually around 44-60px height + top inset
  const dropdownTop = (Platform.OS === 'ios' ? 44 : 56) + insets.top + 10;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setVisible(true)} style={styles.avatarContainer}>
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholderAvatar]}>
            <UserIcon size={20} color="#FFF" />
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={[styles.dropdown, { top: dropdownTop }]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
              <Settings size={20} color="#333" />
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <LogOut size={20} color="#FF3B30" />
              <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 16,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  placeholderAvatar: {
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  dropdown: {
    position: 'absolute',
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderRadius: 8,
  },
  menuText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  logoutText: {
    color: '#FF3B30',
  },
  divider: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginVertical: 4,
  },
});
