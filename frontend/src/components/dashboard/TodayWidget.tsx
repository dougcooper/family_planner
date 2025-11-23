import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TodayWidgetProps {
  taskCount: number;
  eventCount: number;
  dinnerPlan: string | null;
}

export function TodayWidget({ taskCount, eventCount, dinnerPlan }: TodayWidgetProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today at a Glance</Text>
      
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{taskCount}</Text>
          <Text style={styles.statLabel}>Tasks</Text>
        </View>
        
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{eventCount}</Text>
          <Text style={styles.statLabel}>Events</Text>
        </View>
        
        <View style={styles.statWide}>
          <Text style={styles.dinnerLabel}>Dinner</Text>
          <Text style={styles.dinnerText}>
            {dinnerPlan || 'Not planned'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statWide: {
    flex: 2,
    marginLeft: 16,
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
  },
  dinnerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dinnerText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});
