import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { RewardCatalog } from '../src/components/rewards/RewardCatalog';
import { database } from '../src/model/database';
import { authProvider } from '../src/logic/auth';
import { DashboardLayout } from '../src/components/dashboard/DashboardLayout';

export default function RewardsScreen() {
  const [userId] = useState<string | null>(() => {
    const user = authProvider.getState().user;
    return user ? user.id : null;
  });

  if (!userId) {
    return (
      <DashboardLayout>
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text>Please log in to view rewards.</Text>
        </View>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <RewardCatalog database={database} currentUserId={userId} />
    </DashboardLayout>
  );
}
