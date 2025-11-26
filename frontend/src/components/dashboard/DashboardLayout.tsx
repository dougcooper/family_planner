import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { UserMenu } from '../navigation/UserMenu';
import { WeatherBanner } from '../weather/WeatherBanner';

interface DashboardLayoutProps {
  children: React.ReactNode;
  scrollable?: boolean;
}

export function DashboardLayout({ children, scrollable = true }: DashboardLayoutProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Update immediately to ensure client-side hydration matches if needed, 
    // but mostly to keep time fresh.
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000); // Update every second to keep time accurate

    return () => clearInterval(timer);
  }, []);

  const dateStr = now.toLocaleDateString(undefined, { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const timeStr = now.toLocaleTimeString(undefined, { 
    hour: 'numeric', 
    minute: '2-digit' 
  });

  const ContentWrapper = scrollable ? ScrollView : View;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Family Dashboard</Text>
          <Text style={styles.subtitle}>{dateStr} • {timeStr}</Text>
          <WeatherBanner />
        </View>
        <UserMenu />
      </View>
      
      <ContentWrapper style={styles.content}>
        {children}
      </ContentWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});
