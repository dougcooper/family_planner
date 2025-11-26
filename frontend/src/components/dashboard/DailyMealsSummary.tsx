import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MealPlan } from '../../model/models';
import { MealType } from '@family-planner/types';

interface DailyMealsSummaryProps {
  mealPlans: MealPlan[];
}

export function DailyMealsSummary({ mealPlans }: DailyMealsSummaryProps) {
  const getMeal = (type: MealType) => mealPlans.find(m => m.mealType === type);

  const breakfast = getMeal('BREAKFAST');
  const lunch = getMeal('LUNCH');
  const dinner = getMeal('DINNER');

  const hasMeals = breakfast || lunch || dinner;

  const renderMealRow = (type: string, meal: MealPlan | undefined, icon: string) => {
    if (!meal) return null;
    return (
      <View style={styles.mealRow} key={type}>
        <Text style={styles.mealType}>{icon} {type}</Text>
        <Text style={styles.mealDescription}>{meal.description}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Today&apos;s Meals</Text>
      
      {hasMeals ? (
        <View style={styles.mealsList}>
          {renderMealRow('Breakfast', breakfast, '🍳')}
          {renderMealRow('Lunch', lunch, '🥪')}
          {renderMealRow('Dinner', dinner, '🍽️')}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👨‍🍳</Text>
          <Text style={styles.emptyText}>No meals planned today</Text>
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
  mealsList: {
    gap: 12,
  },
  mealRow: {
    padding: 12,
    backgroundColor: '#F5F9FF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  mealType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  mealDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
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
