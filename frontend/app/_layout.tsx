import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Home, CheckSquare, Utensils, List, Gift } from 'lucide-react-native';
import { authProvider } from '../src/logic/auth';

// Cast icons to any to avoid type errors with color prop
const HomeIcon = Home as any;
const CheckSquareIcon = CheckSquare as any;
const UtensilsIcon = Utensils as any;
const ListIcon = List as any;
const GiftIcon = Gift as any;

export default function RootLayout() {
  useEffect(() => {
    authProvider.initialize();
  }, []);

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
    </Tabs>
  );
}
