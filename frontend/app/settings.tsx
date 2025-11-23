import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, Alert, Platform } from 'react-native';
import { DashboardLayout } from '../src/components/dashboard/DashboardLayout';
import { authProvider } from '../src/logic/auth';
import { database } from '../src/model/database';
import { User, Family } from '../src/model/models';
import { Q } from '@nozbe/watermelondb';
import { Toast } from '../src/components/common/Toast';
import { syncDatabase } from '../src/logic/sync';

export default function SettingsScreen() {
  const [currentUser, setCurrentUser] = useState(authProvider.getState().user);
  const [users, setUsers] = useState<User[]>([]);
  const [family, setFamily] = useState<Family | null>(null);
  const [timeoutSeconds, setTimeoutSeconds] = useState('120');
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'PARENT' | 'CHILD'>('CHILD');
  const [newMemberPin, setNewMemberPin] = useState('');
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    const unsubscribe = authProvider.subscribe((state) => {
      setCurrentUser(state.user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      const allUsers = await database.get<User>('users').query().fetch();
      setUsers(allUsers);
    } catch (e) {
      console.error("Error loading users", e);
    }

    const user = currentUser || authProvider.getState().user;
    console.log('Loading data for user:', user);
    
    if (user?.familyId) {
      try {
        console.log('Looking for family:', user.familyId);
        const familyRecord = await database.get<Family>('families').find(user.familyId);
        console.log('Found family locally:', familyRecord);
        setFamily(familyRecord);
        setTimeoutSeconds(familyRecord.kioskTimeoutSeconds.toString());
      } catch (e) {
        console.log("Family not found locally, attempting sync...");
        try {
          await syncDatabase();
          // Debug: check what families exist
          const allFamilies = await database.get<Family>('families').query().fetch();
          console.log('All families in DB:', allFamilies.map(f => ({ id: f.id, name: f.name })));

          const familyRecord = await database.get<Family>('families').find(user.familyId);
          console.log('Found family after sync:', familyRecord);
          setFamily(familyRecord);
          setTimeoutSeconds(familyRecord.kioskTimeoutSeconds.toString());
        } catch (retryError) {
          console.error("Error loading family after sync", retryError);
        }
      }
    } else {
      console.warn('No familyId found on user');
    }
  };

  const handleSync = async () => {
    try {
      showToast("Syncing...", 'success');
      await syncDatabase();
      await loadData();
      showToast("Sync complete", 'success');
    } catch (e) {
      console.error("Sync failed", e);
      const errorMessage = e instanceof Error ? e.message : "Sync failed";
      showToast(errorMessage, 'error');
    }
  };

  const handleSaveTimeout = async () => {
    if (!family) {
      showToast("Family data not loaded. Please try again.", 'error');
      loadData(); // Try loading again
      return;
    }
    
    const seconds = parseInt(timeoutSeconds, 10);
    if (isNaN(seconds) || (seconds < 30 && seconds !== 0)) {
      showToast("Please enter a valid number of seconds (minimum 30, or 0 to disable).", 'error');
      return;
    }

    try {
      await database.write(async () => {
        await family.update(f => {
          f.kioskTimeoutSeconds = seconds;
        });
      });
      
      authProvider.setKioskTimeout(seconds);
      showToast("Kiosk timeout updated.", 'success');
    } catch (error) {
      console.error('Failed to update timeout:', error);
      showToast('Failed to update timeout', 'error');
    }
  };

  const handleAddMember = async () => {
    if (!newMemberName || !newMemberPin || newMemberPin.length !== 4) {
      showToast('Please enter a name and a 4-digit PIN', 'error');
      return;
    }

    try {
      await database.write(async () => {
        await database.get<User>('users').create(user => {
          user.name = newMemberName;
          user.role = newMemberRole;
          user.familyId = currentUser?.familyId || '';
          user.pinHash = newMemberPin; // In a real app, hash this!
          user.pointsBalance = 0;
          user.emailFrequency = 'WEEKLY';
        });
      });
      
      setNewMemberName('');
      setNewMemberPin('');
      setIsAddMemberModalVisible(false);
      loadData();
      showToast('Family member added successfully', 'success');
    } catch (error) {
      console.error('Failed to add member:', error);
      showToast('Failed to add member', 'error');
    }
  };

  const handleLogout = async () => {
    await authProvider.logout();
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <View>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userRole}>{item.role}</Text>
      </View>
      {currentUser?.role === 'PARENT' && (
        <TouchableOpacity onPress={() => Alert.alert('Edit', 'Edit functionality coming soon')}>
          <Text style={styles.editButton}>Edit</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <DashboardLayout>
        <View style={styles.container}>
          <Text style={styles.header}>Settings</Text>

          {currentUser?.role === 'PARENT' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kiosk Settings</Text>
              <Text style={styles.label}>Auto-Logout Timeout (seconds)</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 12 }]}
                  value={timeoutSeconds}
                  onChangeText={setTimeoutSeconds}
                  keyboardType="numeric"
                  placeholder="120"
                />
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveTimeout}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Family Members</Text>
            <FlatList
              data={users}
              renderItem={renderUserItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
            {currentUser?.role === 'PARENT' && (
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setIsAddMemberModalVisible(true)}
              >
                <Text style={styles.addButtonText}>+ Add Member</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.logoutButton, { marginTop: 12, backgroundColor: '#E0F2FE' }]} 
              onPress={handleSync}
            >
              <Text style={[styles.logoutButtonText, { color: '#0284C7' }]}>Sync Data</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.logoutButton, { marginTop: 12, backgroundColor: '#FEE2E2' }]} 
              onPress={() => {
                const performReset = async () => {
                  try {
                    console.log("Starting nuclear reset...");
                    
                    // 1. Try WatermelonDB reset
                    try {
                      await database.unsafeResetDatabase();
                    } catch (e) {
                      console.warn("WatermelonDB reset failed", e);
                    }

                    // 2. Nuke all IndexedDB databases
                    if (Platform.OS === 'web' && window.indexedDB && window.indexedDB.databases) {
                      try {
                        const dbs = await window.indexedDB.databases();
                        console.log("Found databases:", dbs);
                        for (const db of dbs) {
                          if (db.name) {
                            console.log(`Deleting IndexedDB: ${db.name}`);
                            const req = window.indexedDB.deleteDatabase(db.name);
                            await new Promise((resolve, reject) => {
                              req.onsuccess = () => resolve(true);
                              req.onerror = () => reject(req.error);
                              req.onblocked = () => console.warn(`Delete blocked for ${db.name}`);
                            });
                          }
                        }
                      } catch (e) {
                        console.error("Failed to list/delete databases", e);
                        // Fallback for older browsers or if databases() is not supported
                        const knownDBs = ['watermelon', 'family_dashboard', 'family_planner_db', 'lokidb'];
                        for (const name of knownDBs) {
                           window.indexedDB.deleteDatabase(name);
                        }
                      }
                    }

                    // 3. Clear LocalStorage
                    if (Platform.OS === 'web') {
                      localStorage.clear();
                    }

                  } catch (e) {
                    console.error("Reset failed", e);
                    showToast("Reset failed, check console", 'error');
                  } finally {
                    await authProvider.logout();
                    if (Platform.OS === 'web') {
                      window.location.reload();
                    }
                  }
                };

                if (Platform.OS === 'web') {
                  if (window.confirm("Reset Database? This will clear all local data and fix sync issues. You will be logged out.")) {
                    performReset();
                  }
                } else {
                  Alert.alert(
                    "Reset Database",
                    "This will clear all local data and fix sync issues. You will be logged out.",
                    [
                      { text: "Cancel", style: "cancel" },
                      { 
                        text: "Reset", 
                        style: "destructive", 
                        onPress: performReset
                      }
                    ]
                  );
                }
              }}
            >
              <Text style={[styles.logoutButtonText, { color: '#DC2626' }]}>Reset Database</Text>
            </TouchableOpacity>
          </View>

          <Modal
            visible={isAddMemberModalVisible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setIsAddMemberModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Family Member</Text>
                <TouchableOpacity onPress={() => setIsAddMemberModalVisible(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalContent}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={newMemberName}
                  onChangeText={setNewMemberName}
                  placeholder="Name"
                />

                <Text style={styles.label}>Role</Text>
                <View style={styles.roleSelector}>
                  <TouchableOpacity 
                    style={[styles.roleOption, newMemberRole === 'PARENT' && styles.roleOptionSelected]}
                    onPress={() => setNewMemberRole('PARENT')}
                  >
                    <Text style={[styles.roleText, newMemberRole === 'PARENT' && styles.roleTextSelected]}>Parent</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.roleOption, newMemberRole === 'CHILD' && styles.roleOptionSelected]}
                    onPress={() => setNewMemberRole('CHILD')}
                  >
                    <Text style={[styles.roleText, newMemberRole === 'CHILD' && styles.roleTextSelected]}>Child</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>PIN (4 digits)</Text>
                <TextInput
                  style={styles.input}
                  value={newMemberPin}
                  onChangeText={setNewMemberPin}
                  placeholder="1234"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />

                <TouchableOpacity style={styles.createButton} onPress={handleAddMember}>
                  <Text style={styles.createButtonText}>Add Member</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </DashboardLayout>
      <Toast 
        visible={toastVisible} 
        message={toastMessage} 
        type={toastType} 
        onHide={() => setToastVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1E293B',
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
  },
  userRole: {
    fontSize: 14,
    color: '#64748B',
  },
  editButton: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  addButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  logoutButton: {
    padding: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 20,
    color: '#64748B',
    padding: 8,
  },
  modalContent: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  roleOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  roleText: {
    color: '#64748B',
    fontWeight: '500',
  },
  roleTextSelected: {
    color: '#3B82F6',
  },
  createButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
