import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Platform } from 'react-native';
import { Database, Q } from '@nozbe/watermelondb';
import { MealPlan } from '../../model/models';
import { addMealToGroceryList } from '../../logic/meals';
import { getStartOfWeek, formatDateToYYYYMMDD } from '../../logic/date';

interface MealPlannerProps {
  database: Database;
  familyId: string;
}

interface DayMeals {
  date: string;
  breakfast?: MealPlan;
  lunch?: MealPlan;
  dinner?: MealPlan;
}

export function MealPlanner({ database, familyId }: MealPlannerProps) {
  const [weekDays, setWeekDays] = useState<DayMeals[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMeal, setEditingMeal] = useState<{ date: string; mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' } | null>(null);
  const [mealDescription, setMealDescription] = useState('');

  useEffect(() => {
    loadWeekMeals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWeekMeals = async () => {
    try {
      const startOfWeek = getStartOfWeek();
      const days: DayMeals[] = [];

      // Generate 7 days starting from Monday
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateStr = formatDateToYYYYMMDD(date);
        // console.log('Loading meals for:', dateStr);

        // Load meals for this day
        const dayMeals = await database
          .get<MealPlan>('meal_plans')
          .query(
            Q.where('family_id', familyId),
            Q.where('date', dateStr),
            Q.sortBy('updated_at', Q.asc) // Process oldest to newest, so newest wins in the loop
          )
          .fetch();

        const dayObj: DayMeals = { date: dateStr };
        for (const meal of dayMeals) {
          if (meal.mealType === 'BREAKFAST') dayObj.breakfast = meal;
          if (meal.mealType === 'LUNCH') dayObj.lunch = meal;
          if (meal.mealType === 'DINNER') dayObj.dinner = meal;
        }

        days.push(dayObj);
      }

      setWeekDays(days);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading week meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMeal = (date: string, mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER', existing?: MealPlan) => {
    setEditingMeal({ date, mealType });
    setMealDescription(existing?.description || '');
    setEditModalVisible(true);
  };

  const handleSaveMeal = async () => {
    if (!editingMeal || !mealDescription.trim()) return;

    try {
      const existing = await database
        .get<MealPlan>('meal_plans')
        .query(
          Q.where('family_id', familyId),
          Q.where('date', editingMeal.date),
          Q.where('meal_type', editingMeal.mealType),
          Q.sortBy('updated_at', Q.desc)
        )
        .fetch();

      await database.write(async () => {
        if (existing.length > 0) {
          // Update the most recent existing meal
          await existing[0].update((meal) => {
            meal.description = mealDescription.trim();
          });
          
          // Clean up duplicates if any
          if (existing.length > 1) {
            for (let i = 1; i < existing.length; i++) {
              await existing[i].markAsDeleted();
            }
          }
        } else {
          // Create new meal
          await database.get<MealPlan>('meal_plans').create((meal) => {
            meal.familyId = familyId;
            meal.date = editingMeal.date;
            meal.mealType = editingMeal.mealType;
            meal.description = mealDescription.trim();
          });
        }
      });

      setEditModalVisible(false);
      setEditingMeal(null);
      setMealDescription('');
      await loadWeekMeals();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving meal:', error);
      alert('Failed to save meal');
    }
  };

  const handleDeleteMeal = async (meal: MealPlan) => {
    const deleteAction = async () => {
      try {
        await database.write(async () => {
          await meal.markAsDeleted();
        });
        await loadWeekMeals();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error deleting meal:', error);
        alert('Failed to delete meal');
      }
    };

    if (Platform.OS === 'web') {
      if (confirm(`Delete "${meal.description}"?`)) {
        await deleteAction();
      }
    } else {
      Alert.alert(
        'Delete Meal',
        `Delete "${meal.description}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: deleteAction }
        ]
      );
    }
  };

  const handleAddToGroceryList = async (meal: MealPlan) => {
    try {
      const result = await addMealToGroceryList(database, familyId, meal.description);
      if (result.success) {
        alert(`Added ${result.itemsAdded} item(s) to grocery list!`);
      } else {
        alert(`Failed to add to grocery list: ${result.error}`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error adding meal to grocery list:', error);
      alert('Failed to add to grocery list');
    }
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case 'BREAKFAST': return '🌅';
      case 'LUNCH': return '☀️';
      case 'DINNER': return '🌙';
      default: return '🍽️';
    }
  };

  const renderMealSlot = (day: DayMeals, mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER', meal?: MealPlan) => {
    return (
      <View key={`${day.date}-${mealType}`} style={styles.mealSlot}>
        {meal ? (
          <View style={styles.mealCard}>
            <Text style={styles.mealText}>{meal.description}</Text>
            <View style={styles.mealActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleEditMeal(day.date, mealType, meal)}
              >
                <Text style={styles.iconButtonText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleAddToGroceryList(meal)}
              >
                <Text style={styles.iconButtonText}>🛒</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleDeleteMeal(meal)}
              >
                <Text style={styles.iconButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.emptyMealSlot}
            onPress={() => handleEditMeal(day.date, mealType)}
          >
            <Text style={styles.emptyMealText}>+ Add {mealType.toLowerCase()}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading meal planner...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Weekly Meal Planner</Text>
        <Text style={styles.headerSubtitle}>Plan your family meals for the week</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
        <View style={styles.weekGrid}>
          {/* Meal type labels */}
          <View style={styles.mealTypeColumn}>
            <View style={styles.dayHeader} />
            <View style={styles.mealTypeLabel}>
              <Text style={styles.mealTypeText}>🌅 Breakfast</Text>
            </View>
            <View style={styles.mealTypeLabel}>
              <Text style={styles.mealTypeText}>☀️ Lunch</Text>
            </View>
            <View style={styles.mealTypeLabel}>
              <Text style={styles.mealTypeText}>🌙 Dinner</Text>
            </View>
          </View>

          {/* Days columns */}
          {weekDays.map((day) => {
            const isToday = day.date === formatDateToYYYYMMDD(new Date());
            return (
              <View key={day.date} style={[styles.dayColumn, isToday && styles.todayColumn]}>
                <View style={[styles.dayHeader, isToday && styles.todayHeader]}>
                  <Text style={styles.dayName}>{getDayName(day.date)}</Text>
                  <Text style={styles.dayDate}>{getDateDisplay(day.date)}</Text>
                  {isToday && <Text style={styles.todayLabel}>TODAY</Text>}
                </View>
                {renderMealSlot(day, 'BREAKFAST', day.breakfast)}
                {renderMealSlot(day, 'LUNCH', day.lunch)}
                {renderMealSlot(day, 'DINNER', day.dinner)}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Edit Meal Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingMeal ? `${getMealIcon(editingMeal.mealType)} ${editingMeal.mealType}` : 'Edit Meal'}
            </Text>
            
            <TextInput
              style={styles.modalInput}
              value={mealDescription}
              onChangeText={setMealDescription}
              placeholder="What's for this meal?"
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleSaveMeal}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setEditModalVisible(false);
                  setEditingMeal(null);
                  setMealDescription('');
                }}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#64748B',
  },
  scrollContainer: {
    flex: 1,
  },
  weekGrid: {
    flexDirection: 'row',
    padding: 16,
  },
  mealTypeColumn: {
    width: 120,
    marginRight: 8,
  },
  dayColumn: {
    width: 180,
    marginRight: 8,
  },
  dayHeader: {
    height: 75,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    marginBottom: 8,
  },
  todayColumn: {
    backgroundColor: '#EBF8FF',
    borderRadius: 12,
    padding: 4,
    marginRight: 4, // Adjust margin to account for padding
  },
  todayHeader: {
    backgroundColor: '#2563EB',
    elevation: 4,
    boxShadow: '0px 2px 4px rgba(37, 99, 235, 0.3)',
  },
  todayLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFD700',
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 1,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  dayDate: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  mealTypeLabel: {
    height: 100,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    marginBottom: 8,
  },
  mealTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  mealSlot: {
    height: 100,
    marginBottom: 8,
  },
  mealCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    elevation: 1,
  },
  mealText: {
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 8,
    flex: 1,
  },
  mealActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  iconButtonText: {
    fontSize: 16,
  },
  emptyMealSlot: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMealText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#F1F5F9',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  },
});
