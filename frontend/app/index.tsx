import React, { useState, useEffect } from 'react';
import DashboardContainer from '../src/components/dashboard/DashboardContainer';
import { authProvider } from '../src/logic/auth';

export default function Index() {
  const [user, setUser] = useState(authProvider.getState().user);

  useEffect(() => {
    const unsubscribe = authProvider.subscribe((state) => {
      setUser(state.user);
    });
    return unsubscribe;
  }, []);

  return <DashboardContainer familyId={user?.familyId} />;
}

