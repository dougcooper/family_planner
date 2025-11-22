import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { MealPlanner } from '../src/components/meals/MealPlanner';
import { database } from '../src/model/database';
import { authProvider } from '../src/logic/auth';
import { DashboardLayout } from '../src/components/dashboard/DashboardLayout';

export default function MealsScreen() {
  const [familyId] = useState<string | null>(() => {
    const user = authProvider.getState().user;
    return user ? user.familyId : null;
  });

  if (!familyId) {
    return (
      <DashboardLayout>
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text>Please log in to view meal plans.</Text>
        </View>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <MealPlanner database={database} familyId={familyId} />
    </DashboardLayout>
  );
}
