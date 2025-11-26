import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Database } from '@nozbe/watermelondb';
import { Recipe } from '../../model/models';
import { bulkAddToGroceryList } from '../../logic/meals';
import { Toast } from '../common/Toast';
import log from '../../utils/logger';

interface RecipeDetailProps {
  recipe: Recipe | null;
  visible: boolean;
  onClose: () => void;
  onEdit?: () => void;
  database: Database;
  familyId: string;
}

export function RecipeDetail({ recipe, visible, onClose, onEdit, database, familyId }: RecipeDetailProps) {
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  if (!recipe) return null;

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleAddToGroceryList = async () => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      showToast('This recipe has no ingredients to add.', 'error');
      return;
    }

    try {
      const result = await bulkAddToGroceryList(database, familyId, recipe.ingredients);
      if (result.success) {
        showToast(`Added ${result.itemsAdded} items to grocery list.`, 'success');
      } else {
        showToast('Failed to add items to grocery list.', 'error');
      }
    } catch (error) {
      log.error('Error adding ingredients:', error);
      showToast('An error occurred while adding ingredients.', 'error');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{recipe.name}</Text>
            <View style={styles.headerButtons}>
              {onEdit && (
                <TouchableOpacity onPress={onEdit} style={styles.editButton}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.scrollContent}>
            {recipe.description ? (
              <Text style={styles.description}>{recipe.description}</Text>
            ) : null}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <TouchableOpacity style={styles.addButton} onPress={handleAddToGroceryList}>
                <Text style={styles.addButtonText}>+ Add to List</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.ingredientsList}>
              {recipe.ingredients.map((ingredient, index) => (
                <Text key={index} style={styles.ingredient}>• {ingredient}</Text>
              ))}
              {recipe.ingredients.length === 0 && (
                <Text style={styles.emptyText}>No ingredients listed.</Text>
              )}
            </View>

            <Text style={styles.sectionTitle}>Instructions</Text>
            {recipe.instructions ? (
              <Text style={styles.instructions}>{recipe.instructions}</Text>
            ) : (
              <Text style={styles.emptyText}>No instructions provided.</Text>
            )}
          </ScrollView>
        </View>
      </View>
      <Toast 
        visible={toastVisible} 
        message={toastMessage} 
        type={toastType} 
        onHide={() => setToastVisible(false)} 
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  editButtonText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#64748B',
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 24,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
    marginTop: 8,
  },
  addButton: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButtonText: {
    color: '#0284C7',
    fontWeight: '600',
    fontSize: 14,
  },
  ingredientsList: {
    marginBottom: 24,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 8,
  },
  ingredient: {
    fontSize: 16,
    color: '#334155',
    marginBottom: 8,
    lineHeight: 24,
  },
  instructions: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 26,
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
});
