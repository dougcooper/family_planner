import { Tabs, Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Home, CheckSquare, Utensils, List, Gift, Settings } from 'lucide-react-native';
import { authProvider } from '../src/logic/auth';
import { syncDatabase } from '../src/logic/sync';

// Cast icons to any to avoid type errors with color prop
const HomeIcon = Home as any;
const CheckSquareIcon = CheckSquare as any;
const UtensilsIcon = Utensils as any;
const ListIcon = List as any;
const GiftIcon = Gift as any;
const SettingsIcon = Settings as any;

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = authProvider.subscribe((state) => {
      setIsAuthenticated(state.isAuthenticated);
      if (state.isAuthenticated) {
        syncDatabase().catch(console.error);
      }
    });
    
    authProvider.initialize().finally(() => {
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login' as any);
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    }
  }, [isAuthenticated, segments, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Slot />;
  }

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#4A90E2' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({ color }: { color: string }) => <HomeIcon size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          headerShown: false,
          tabBarIcon: ({ color }: { color: string }) => <CheckSquareIcon size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="meals"
        options={{
          title: 'Meals',
          headerShown: false,
          tabBarIcon: ({ color }: { color: string }) => <UtensilsIcon size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          title: 'Lists',
          headerShown: false,
          tabBarIcon: ({ color }: { color: string }) => <ListIcon size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          headerShown: false,
          tabBarIcon: ({ color }: { color: string }) => <GiftIcon size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color }: { color: string }) => <SettingsIcon size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
