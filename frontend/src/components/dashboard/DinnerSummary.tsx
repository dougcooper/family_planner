import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MealPlan } from '../../model/models';

interface DinnerSummaryProps {
  mealPlan: MealPlan | null;
}

export function DinnerSummary({ mealPlan }: DinnerSummaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Tonight&apos;s Dinner</Text>
      
      {mealPlan ? (
        <View style={styles.mealCard}>
          <Text style={styles.mealType}>🍽️ Dinner</Text>
          <Text style={styles.mealDescription}>{mealPlan.description}</Text>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🤔</Text>
          <Text style={styles.emptyText}>No dinner plan yet</Text>
          <Text style={styles.emptySubtext}>Tap to add a meal plan</Text>
        </View>
      )}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  mealCard: {
    padding: 16,
    backgroundColor: '#F5F9FF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  mealType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 8,
  },
  mealDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});
