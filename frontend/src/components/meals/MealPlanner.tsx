import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Platform } from 'react-native';
import { Database, Q } from '@nozbe/watermelondb';
import { withObservables } from '@nozbe/watermelondb/react';
import { MealPlan, Recipe, MealLabel } from '../../model/models';
import { ensureDefaultMealLabels } from '../../logic/meals';
import { getStartOfWeek, formatDateToYYYYMMDD } from '../../logic/date';
import { RecipeManager } from './RecipeManager';
import { RecipeDetail } from './RecipeDetail';

interface MealPlannerProps {
  database: Database;
  familyId: string;
  mealLabels: MealLabel[];
}

interface DayMeals {
  date: string;
  meals: Record<string, MealPlan[]>; // Map labelId -> MealPlan[]
}

function MealPlannerComponent({ database, familyId, mealLabels }: MealPlannerProps) {
  const [weekDays, setWeekDays] = useState<DayMeals[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipeManagerVisible, setRecipeManagerVisible] = useState(false);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  
  // Slot Management State
  const [managingSlot, setManagingSlot] = useState<{ date: string; labelId: string; labelName: string; meals: MealPlan[] } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  useEffect(() => {
    ensureDefaultMealLabels(database, familyId);
  }, [database, familyId]);

  useEffect(() => {
    loadWeekMeals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealLabels]); // Reload when labels change

  const loadWeekMeals = async () => {
    try {
      const startOfWeek = getStartOfWeek();
      const days: DayMeals[] = [];

      // Generate 7 days starting from Monday
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateStr = formatDateToYYYYMMDD(date);
        
        // Load meals for this day
        const dayMeals = await database
          .get<MealPlan>('meal_plans')
          .query(
            Q.where('family_id', familyId),
            Q.where('date', dateStr),
            Q.sortBy('updated_at', Q.asc)
          )
          .fetch();

        const mealsMap: Record<string, MealPlan[]> = {};
        // Initialize arrays for all labels
        mealLabels.forEach(label => {
          mealsMap[label.id] = [];
        });

        for (const meal of dayMeals) {
          if (meal.mealLabelId) {
            if (!mealsMap[meal.mealLabelId]) {
              mealsMap[meal.mealLabelId] = [];
            }
            mealsMap[meal.mealLabelId].push(meal);
          }
        }

        days.push({ date: dateStr, meals: mealsMap });
      }

      setWeekDays(days);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading week meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSlot = async () => {
    if (!managingSlot) return;
    try {
      const updatedMeals = await database.get<MealPlan>('meal_plans').query(
        Q.where('family_id', familyId),
        Q.where('date', managingSlot.date),
        Q.where('meal_label_id', managingSlot.labelId),
        Q.sortBy('created_at', Q.asc)
      ).fetch();
      setManagingSlot(prev => prev ? { ...prev, meals: updatedMeals } : null);
      await loadWeekMeals();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error refreshing slot", e);
    }
  };

  const handleManageSlot = (date: string, label: MealLabel, meals: MealPlan[]) => {
    setManagingSlot({ date, labelId: label.id, labelName: label.name, meals });
    setIsAddingNote(false);
    setNoteText('');
  };

  const handleAddNote = async () => {
    if (!managingSlot || !noteText.trim()) return;
    try {
      await database.write(async () => {
        await database.get<MealPlan>('meal_plans').create((meal) => {
          meal.familyId = familyId;
          meal.date = managingSlot.date;
          meal.mealLabelId = managingSlot.labelId;
          meal.description = noteText.trim();
        });
      });
      setNoteText('');
      setIsAddingNote(false);
      await refreshSlot();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error adding note:', error);
      Alert.alert('Error', 'Failed to add note');
    }
  };

  const handleAddRecipe = async (recipe: Recipe) => {
    if (!managingSlot) return;
    try {
      await database.write(async () => {
        await database.get<MealPlan>('meal_plans').create((meal) => {
          meal.familyId = familyId;
          meal.date = managingSlot.date;
          meal.mealLabelId = managingSlot.labelId;
          meal.description = recipe.name; // Use recipe name as description fallback/display
          meal.recipeId = recipe.id;
        });
      });
      setRecipeManagerVisible(false);
      await refreshSlot();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error adding recipe:', error);
      Alert.alert('Error', 'Failed to add recipe');
    }
  };

  const handleDeleteItem = async (meal: MealPlan) => {
    try {
      await database.write(async () => {
        await meal.markAsDeleted();
      });
      await refreshSlot();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting item:', error);
      Alert.alert('Error', 'Failed to delete item');
    }
  };

  const handleViewRecipe = async (meal: MealPlan) => {
    if (meal.recipeId) {
      try {
        const recipe = await meal.recipe.fetch();
        setViewingRecipe(recipe);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching recipe details:', error);
        Alert.alert('Error', 'Failed to load recipe details');
      }
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

  const renderMealSlot = (day: DayMeals, label: MealLabel, meals: MealPlan[] = []) => {
    return (
      <View key={`${day.date}-${label.id}`} style={styles.mealSlot}>
        {meals.length > 0 ? (
          <TouchableOpacity 
            style={styles.mealCard}
            onPress={() => handleManageSlot(day.date, label, meals)}
          >
            {meals.map((meal) => (
              <View key={meal.id} style={styles.mealItemRow}>
                <Text style={styles.mealText} numberOfLines={1}>
                  {meal.recipeId ? '📖 ' : '📝 '}{meal.description}
                </Text>
              </View>
            ))}
            {meals.length > 3 && (
              <Text style={styles.moreText}>+ {meals.length - 3} more</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.emptyMealSlot}
            onPress={() => handleManageSlot(day.date, label, [])}
          >
            <Text style={styles.emptyMealText}>+ Add</Text>
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
        <Text style={styles.title}>Weekly Meal Plan</Text>
        <TouchableOpacity 
          style={styles.recipeButton}
          onPress={() => setRecipeManagerVisible(true)}
        >
          <Text style={styles.recipeButtonText}>Manage Recipes</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.weekGrid}>
          {/* Meal type labels */}
          <View style={styles.mealTypeColumn}>
            <View style={styles.dayHeader} />
            {mealLabels.map(label => (
              <View key={label.id} style={styles.mealTypeLabel}>
                <Text style={styles.mealTypeText}>{label.name}</Text>
              </View>
            ))}
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
                {mealLabels.map(label => (
                  renderMealSlot(day, label, day.meals[label.id])
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Manage Slot Modal */}
      <Modal
        visible={!!managingSlot && !recipeManagerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setManagingSlot(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {managingSlot ? `${managingSlot.labelName} (${getDateDisplay(managingSlot.date)})` : 'Manage Meal'}
              </Text>
              <TouchableOpacity onPress={() => setManagingSlot(null)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.slotItemsList}>
              {managingSlot?.meals.map((meal) => (
                <View key={meal.id} style={styles.slotItem}>
                  <TouchableOpacity 
                    style={styles.slotItemContent}
                    onPress={() => meal.recipeId && handleViewRecipe(meal)}
                  >
                    <Text style={styles.slotItemIcon}>{meal.recipeId ? '📖' : '📝'}</Text>
                    <Text style={[styles.slotItemText, meal.recipeId && styles.linkText]}>
                      {meal.description}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteItemButton}
                    onPress={() => handleDeleteItem(meal)}
                  >
                    <Text style={styles.deleteItemText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {managingSlot?.meals.length === 0 && (
                <Text style={styles.emptySlotText}>No items yet.</Text>
              )}
            </ScrollView>

            {isAddingNote ? (
              <View style={styles.addNoteContainer}>
                <TextInput
                  style={styles.modalInput}
                  value={noteText}
                  onChangeText={setNoteText}
                  placeholder="Enter note..."
                  autoFocus
                />
                <View style={styles.addNoteActions}>
                  <TouchableOpacity style={styles.saveNoteButton} onPress={handleAddNote}>
                    <Text style={styles.saveNoteButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.cancelNoteButton} 
                    onPress={() => setIsAddingNote(false)}
                  >
                    <Text style={styles.cancelNoteButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setRecipeManagerVisible(true)}
                >
                  <Text style={styles.actionButtonIcon}>📖</Text>
                  <Text style={styles.actionButtonText}>Add Recipe</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setIsAddingNote(true)}
                >
                  <Text style={styles.actionButtonIcon}>📝</Text>
                  <Text style={styles.actionButtonText}>Add Note</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Recipe Manager */}
      <Modal
        visible={recipeManagerVisible}
        animationType="slide"
        onRequestClose={() => setRecipeManagerVisible(false)}
      >
        <View style={{ flex: 1, paddingTop: Platform.OS === 'ios' ? 40 : 0 }}>
          <RecipeManager 
            database={database} 
            familyId={familyId}
            onClose={() => setRecipeManagerVisible(false)}
            onSelectRecipe={managingSlot ? handleAddRecipe : undefined}
          />
        </View>
      </Modal>

      {/* Recipe Detail View */}
      <RecipeDetail
        recipe={viewingRecipe}
        visible={!!viewingRecipe}
        onClose={() => setViewingRecipe(null)}
        database={database}
        familyId={familyId}
      />
    </View>
  );
}

const enhance = withObservables(['database'], ({ database }: { database: Database }) => ({
  mealLabels: database.get<MealLabel>('meal_labels').query(Q.sortBy('sort_order', Q.asc)),
}));

export const MealPlanner = enhance(MealPlannerComponent);

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  recipeButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  recipeButtonText: {
    color: '#475569',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  selectRecipeButton: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  selectRecipeButtonText: {
    color: '#0284C7',
    fontWeight: '600',
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
  selectedRecipeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  selectedRecipeInfo: {
    flex: 1,
  },
  selectedRecipeLabel: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedRecipeName: {
    fontSize: 16,
    color: '#166534',
    fontWeight: '500',
  },
  clearRecipeButton: {
    padding: 8,
    marginLeft: 8,
  },
  clearRecipeText: {
    fontSize: 18,
    color: '#15803D',
    fontWeight: 'bold',
  },
  mealItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  moreText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
  },
  closeButton: {
    fontSize: 24,
    color: '#64748B',
    padding: 4,
  },
  slotItemsList: {
    maxHeight: 300,
    marginBottom: 24,
  },
  slotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  slotItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  slotItemText: {
    fontSize: 16,
    color: '#334155',
    flex: 1,
  },
  linkText: {
    color: '#0284C7',
    fontWeight: '500',
  },
  deleteItemButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteItemText: {
    fontSize: 18,
  },
  emptySlotText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontStyle: 'italic',
    padding: 20,
  },
  addNoteContainer: {
    marginTop: 8,
  },
  addNoteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  saveNoteButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveNoteButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  cancelNoteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelNoteButtonText: {
    color: '#64748B',
    fontWeight: '600',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#334155',
    fontWeight: '600',
  },
});
