import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { GroceryList } from '../src/components/lists/GroceryList';
import { database } from '../src/model/database';
import { authProvider } from '../src/logic/auth';
import { DashboardLayout } from '../src/components/dashboard/DashboardLayout';

export default function ListsScreen() {
  const [familyId] = useState<string | null>(() => {
    const user = authProvider.getState().user;
    return user ? user.familyId : null;
  });

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
      <GroceryList database={database} familyId={familyId} />
    </DashboardLayout>
  );
}
