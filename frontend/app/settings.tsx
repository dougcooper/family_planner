import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, Alert, Platform, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { DashboardLayout } from '../src/components/dashboard/DashboardLayout';
import { authProvider } from '../src/logic/auth';
import { database } from '../src/model/database';
import { User, Family } from '../src/model/models';
import { Q } from '@nozbe/watermelondb';
import { Toast } from '../src/components/common/Toast';
import { syncDatabase } from '../src/logic/sync';
import { MealLabelSettings } from '../src/components/settings/MealLabelSettings';
import { getWeatherSettings, saveWeatherSettings, searchCity, CitySearchResult } from '../src/logic/weather';
import log from '../src/utils/logger';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function SettingsScreen() {
  const [currentUser, setCurrentUser] = useState(authProvider.getState().user);
  const [users, setUsers] = useState<User[]>([]);
  const [family, setFamily] = useState<Family | null>(null);
  const [timeoutSeconds, setTimeoutSeconds] = useState('120');
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'PARENT' | 'CHILD'>('CHILD');
  const [newMemberPin, setNewMemberPin] = useState('');
  const [newMemberAvatar, setNewMemberAvatar] = useState('');

  // Edit Member State
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberRole, setEditMemberRole] = useState<'PARENT' | 'CHILD'>('CHILD');
  const [editMemberAvatar, setEditMemberAvatar] = useState('');
  const [isEditMemberModalVisible, setIsEditMemberModalVisible] = useState(false);
  
  // Weather Settings
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<CitySearchResult[]>([]);
  const [selectedCity, setSelectedCity] = useState<CitySearchResult | null>(null);
  const [isSearchingCity, setIsSearchingCity] = useState(false);

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
      loadWeatherSettings();
    }
  }, [currentUser]);

  const loadWeatherSettings = async () => {
    const settings = await getWeatherSettings();
    if (settings.city) {
      setCityQuery(settings.city);
      if (settings.latitude && settings.longitude) {
        setSelectedCity({
          id: 0, // Dummy ID
          name: settings.city,
          latitude: settings.latitude,
          longitude: settings.longitude,
          country: settings.country || '',
        });
      }
    }
  };

  const loadData = async () => {
    try {
      const allUsers = await database.get<User>('users').query().fetch();
      setUsers(allUsers);
    } catch (e) {
      log.error("Error loading users", e);
    }

    const user = currentUser || authProvider.getState().user;
    log.info('Loading data for user:', user);
    
    if (user?.familyId) {
      try {
        log.info('Looking for family:', user.familyId);
        const familyRecord = await database.get<Family>('families').find(user.familyId);
        log.info('Found family locally:', familyRecord);
        setFamily(familyRecord);
        setTimeoutSeconds(familyRecord.kioskTimeoutSeconds.toString());
      } catch (e) {
        log.info("Family not found locally, attempting sync...");
        try {
          await syncDatabase();
          // Debug: check what families exist
          const allFamilies = await database.get<Family>('families').query().fetch();
          log.info('All families in DB:', allFamilies.map((f: Family) => ({ id: f.id, name: f.name })));

          const familyRecord = await database.get<Family>('families').find(user.familyId);
          log.info('Found family after sync:', familyRecord);
          setFamily(familyRecord);
          setTimeoutSeconds(familyRecord.kioskTimeoutSeconds.toString());
        } catch (retryError) {
          log.error("Error loading family after sync", retryError);
        }
      }
    } else {
      log.warn('No familyId found on user');
    }
  };

  const handlePickImage = async (setAvatar: (url: string) => void) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        showToast('Uploading image...', 'success');
        
        // Upload to backend
        const formData = new FormData();

        if (Platform.OS === 'web') {
          const res = await fetch(asset.uri);
          const blob = await res.blob();
          formData.append('file', blob, 'avatar.jpg');
        } else {
          formData.append('file', {
            uri: asset.uri,
            name: 'avatar.jpg',
            type: 'image/jpeg',
          } as any);
        }

        const token = authProvider.getToken();
        const response = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        setAvatar(data.url);
        showToast('Image uploaded successfully', 'success');
      }
    } catch (error) {
      log.error('Error picking image:', error);
      showToast('Failed to upload image', 'error');
    }
  };

  const handleSync = async () => {
    try {
      showToast("Syncing...", 'success');
      await syncDatabase();
      await loadData();
      showToast("Sync complete", 'success');
    } catch (e) {
      log.error("Sync failed", e);
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
      log.error('Failed to update timeout:', error);
      showToast('Failed to update timeout', 'error');
    }
  };

  const handleSearchCity = async (text: string) => {
    setCityQuery(text);
    if (text.length > 2) {
      setIsSearchingCity(true);
      const results = await searchCity(text);
      setCityResults(results);
      setIsSearchingCity(false);
    } else {
      setCityResults([]);
    }
  };

  const handleSelectCity = async (city: CitySearchResult) => {
    setSelectedCity(city);
    setCityQuery(city.name);
    setCityResults([]);
    
    try {
      await saveWeatherSettings({ 
        latitude: city.latitude, 
        longitude: city.longitude, 
        city: city.name,
        country: city.country
      });
      showToast("Weather location updated.", 'success');
    } catch (error) {
      log.error('Failed to update weather settings:', error);
      showToast('Failed to update weather settings', 'error');
    }
  };

  const handleAddMember = async () => {
    if (!newMemberName || !newMemberPin || newMemberPin.length !== 4) {
      showToast('Please enter a name and a 4-digit PIN', 'error');
      return;
    }

    try {
      await database.write(async () => {
        await database.get<User>('users').create((user: User) => {
          user.name = newMemberName;
          user.role = newMemberRole;
          user.familyId = currentUser?.familyId || '';
          user.pinHash = newMemberPin; // In a real app, hash this!
          user.pointsBalance = 0;
          user.emailFrequency = 'WEEKLY';
          user.avatarUrl = newMemberAvatar;
        });
      });
      
      setNewMemberName('');
      setNewMemberPin('');
      setNewMemberAvatar('');
      setIsAddMemberModalVisible(false);
      loadData();
      showToast('Family member added successfully', 'success');
    } catch (error) {
      log.error('Failed to add member:', error);
      showToast('Failed to add member', 'error');
    }
  };

  const handleUpdateMember = async () => {
    if (!editingMember || !editMemberName) {
      showToast('Please enter a name', 'error');
      return;
    }

    try {
      // Check if avatar changed and delete old one
      if (editingMember.avatarUrl && editMemberAvatar !== editingMember.avatarUrl) {
        // Only delete if it's a file on our server (contains /uploads/)
        if (editingMember.avatarUrl.includes('/uploads/')) {
          try {
            const token = authProvider.getToken();
            await fetch(`${API_URL}/upload`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ url: editingMember.avatarUrl }),
            });
          } catch (e) {
            log.error('Failed to delete old avatar', e);
            // Continue with update even if delete fails
          }
        }
      }

      await database.write(async () => {
        await editingMember.update((user: User) => {
          user.name = editMemberName;
          user.role = editMemberRole;
          user.avatarUrl = editMemberAvatar;
        });
      });
      
      setEditingMember(null);
      setIsEditMemberModalVisible(false);
      loadData();
      showToast('Member updated successfully', 'success');
    } catch (error) {
      log.error('Failed to update member:', error);
      showToast('Failed to update member', 'error');
    }
  };



  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.userAvatar} />
        ) : (
          <View style={styles.userAvatarPlaceholder}>
            <Text style={styles.userAvatarPlaceholderText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userRole}>{item.role}</Text>
        </View>
      </View>
      {currentUser?.role === 'PARENT' && (
        <TouchableOpacity onPress={() => {
          setEditingMember(item);
          setEditMemberName(item.name);
          setEditMemberRole(item.role);
          setEditMemberAvatar(item.avatarUrl || '');
          setIsEditMemberModalVisible(true);
        }}>
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

          {currentUser?.familyId && (
            <MealLabelSettings database={database} familyId={currentUser.familyId} />
          )}

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
            <Text style={styles.sectionTitle}>Weather Settings</Text>
            <Text style={styles.label}>City Search</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={cityQuery}
                onChangeText={handleSearchCity}
                placeholder="Search for a city..."
              />
            </View>
            {isSearchingCity && <Text style={styles.helperText}>Searching...</Text>}
            {cityResults.length > 0 && (
              <View style={styles.searchResults}>
                {cityResults.map((city) => (
                  <TouchableOpacity 
                    key={city.id} 
                    style={styles.searchResultItem}
                    onPress={() => handleSelectCity(city)}
                  >
                    <Text style={styles.searchResultText}>
                      {city.name}, {city.admin1 ? `${city.admin1}, ` : ''}{city.country}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {selectedCity && !isSearchingCity && cityResults.length === 0 && (
              <Text style={styles.helperText}>
                Current Location: {selectedCity.name}, {selectedCity.country}
              </Text>
            )}
          </View>

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
                    log.info("Starting nuclear reset...");
                    
                    // 1. Try WatermelonDB reset
                    try {
                      await database.unsafeResetDatabase();
                    } catch (e) {
                      log.warn("WatermelonDB reset failed", e);
                    }

                    // 2. Nuke all IndexedDB databases
                    if (Platform.OS === 'web' && window.indexedDB && window.indexedDB.databases) {
                      try {
                        const dbs = await window.indexedDB.databases();
                        log.info("Found databases:", dbs);
                        for (const db of dbs) {
                          if (db.name) {
                            log.info(`Deleting IndexedDB: ${db.name}`);
                            const req = window.indexedDB.deleteDatabase(db.name);
                            await new Promise((resolve, reject) => {
                              req.onsuccess = () => resolve(true);
                              req.onerror = () => reject(req.error);
                              req.onblocked = () => log.warn(`Delete blocked for ${db.name}`);
                            });
                          }
                        }
                      } catch (e) {
                        log.error("Failed to list/delete databases", e);
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
                    log.error("Reset failed", e);
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

                <Text style={styles.label}>Profile Picture</Text>
                <View style={styles.avatarUploadContainer}>
                  {newMemberAvatar ? (
                    <Image source={{ uri: newMemberAvatar }} style={styles.avatarPreview} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarPlaceholderText}>?</Text>
                    </View>
                  )}
                  <TouchableOpacity 
                    style={styles.uploadButton} 
                    onPress={() => handlePickImage(setNewMemberAvatar)}
                  >
                    <Text style={styles.uploadButtonText}>{newMemberAvatar ? 'Change Photo' : 'Upload Photo'}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.createButton} onPress={handleAddMember}>
                  <Text style={styles.createButtonText}>Add Member</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            visible={isEditMemberModalVisible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setIsEditMemberModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Family Member</Text>
                <TouchableOpacity onPress={() => setIsEditMemberModalVisible(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalContent}>
                <Text style={styles.label}>Profile Picture</Text>
                <View style={styles.avatarUploadContainer}>
                  {editMemberAvatar ? (
                    <Image source={{ uri: editMemberAvatar }} style={styles.avatarPreview} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarPlaceholderText}>?</Text>
                    </View>
                  )}
                  <TouchableOpacity 
                    style={styles.uploadButton} 
                    onPress={() => handlePickImage(setEditMemberAvatar)}
                  >
                    <Text style={styles.uploadButtonText}>{editMemberAvatar ? 'Change Photo' : 'Upload Photo'}</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={editMemberName}
                  onChangeText={setEditMemberName}
                  placeholder="Name"
                />

                <Text style={styles.label}>Role</Text>
                <View style={styles.roleSelector}>
                  <TouchableOpacity 
                    style={[styles.roleOption, editMemberRole === 'PARENT' && styles.roleOptionSelected]}
                    onPress={() => setEditMemberRole('PARENT')}
                  >
                    <Text style={[styles.roleText, editMemberRole === 'PARENT' && styles.roleTextSelected]}>Parent</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.roleOption, editMemberRole === 'CHILD' && styles.roleOptionSelected]}
                    onPress={() => setEditMemberRole('CHILD')}
                  >
                    <Text style={[styles.roleText, editMemberRole === 'CHILD' && styles.roleTextSelected]}>Child</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.createButton} onPress={handleUpdateMember}>
                  <Text style={styles.createButtonText}>Save Changes</Text>
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
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
  uploadButton: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: '#0284C7',
    fontWeight: '600',
  },
  avatarUploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarPlaceholderText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#64748B',
  },
  avatarPreview: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  searchResults: {
    marginTop: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchResultText: {
    fontSize: 16,
    color: '#334155',
  },
  helperText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
});
