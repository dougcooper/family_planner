import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Recipe } from '../../model/models';

interface RecipeDetailProps {
  recipe: Recipe | null;
  visible: boolean;
  onClose: () => void;
}

export function RecipeDetail({ recipe, visible, onClose }: RecipeDetailProps) {
  if (!recipe) return null;

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
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            {recipe.description ? (
              <Text style={styles.description}>{recipe.description}</Text>
            ) : null}

            <Text style={styles.sectionTitle}>Ingredients</Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
    marginTop: 8,
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
