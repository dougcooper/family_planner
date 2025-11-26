import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AllLists } from '../src/components/lists/AllLists';
import { GenericList } from '../src/components/lists/GenericList';
import { ListAssignmentSummary } from '../src/components/lists/ListAssignmentSummary';
import { UserTodosModal } from '../src/components/lists/UserTodosModal';
import { database } from '../src/model/database';
import { authProvider } from '../src/logic/auth';
import { DashboardLayout } from '../src/components/dashboard/DashboardLayout';
import { List, User } from '../src/model/models';

export default function ListsScreen() {
  const [familyId] = useState<string | null>(() => {
    const user = authProvider.getState().user;
    return user ? user.familyId : null;
  });

  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  if (!familyId) {
    return (
      <DashboardLayout>
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text>Please log in to view lists.</Text>
        </View>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout scrollable={false}>
      <View style={styles.wrapper}>
        <Text style={styles.pageTitle}>My Lists</Text>
        <ListAssignmentSummary familyId={familyId} onUserPress={setSelectedUser} />
        <View style={styles.container}>
          <View style={styles.sidebar}>
            <AllLists 
              database={database} 
              familyId={familyId} 
              onSelectList={setSelectedList}
              selectedListId={selectedList?.id}
            />
          </View>
          <View style={styles.mainContent}>
            {selectedList ? (
              <GenericList 
                database={database} 
                list={selectedList} 
              />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>Select a list to view items</Text>
              </View>
            )}
          </View>
        </View>
        <UserTodosModal
          visible={!!selectedUser}
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    flexDirection: 'column',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
  },
  sidebar: {
    width: 350,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    color: '#64748B',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
});
