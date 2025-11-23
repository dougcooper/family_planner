import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { AllLists } from '../src/components/lists/AllLists';
import { GenericList } from '../src/components/lists/GenericList';
import { database } from '../src/model/database';
import { authProvider } from '../src/logic/auth';
import { DashboardLayout } from '../src/components/dashboard/DashboardLayout';
import { List } from '../src/model/models';

export default function ListsScreen() {
  const [familyId] = useState<string | null>(() => {
    const user = authProvider.getState().user;
    return user ? user.familyId : null;
  });

  const [selectedList, setSelectedList] = useState<List | null>(null);

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
    <DashboardLayout>
      {selectedList ? (
        <GenericList 
          database={database} 
          list={selectedList} 
          onBack={() => setSelectedList(null)}
        />
      ) : (
        <AllLists 
          database={database} 
          familyId={familyId} 
          onSelectList={setSelectedList}
        />
      )}
    </DashboardLayout>
  );
}
