import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Alert, Platform } from 'react-native';
import { Database, Q } from '@nozbe/watermelondb';
import { withObservables } from '@nozbe/watermelondb/react';
import { Recipe } from '../../model/models';
import log from '../../utils/logger';

interface RecipeManagerProps {
  database: Database;
  familyId: string;
  recipes: Recipe[];
  onSelectRecipe?: (recipe: Recipe) => void;
  onClose: () => void;
  initialRecipeToEdit?: Recipe | null;
}

function RecipeManagerComponent({ database, familyId, recipes, onSelectRecipe, onClose, initialRecipeToEdit }: RecipeManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [instructions, setInstructions] = useState('');
  const [newIngredient, setNewIngredient] = useState('');

  const resetForm = () => {
    setName('');
    setDescription('');
    setIngredients([]);
    setInstructions('');
    setNewIngredient('');
    setEditingRecipe(null);
    setIsEditing(false);
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setName(recipe.name);
    setDescription(recipe.description || '');
    setIngredients(recipe.ingredients);
    setInstructions(recipe.instructions || '');
    setIsEditing(true);
  };

  React.useEffect(() => {
    if (initialRecipeToEdit) {
      handleEdit(initialRecipeToEdit);
    }
  }, [initialRecipeToEdit]);

  const handleSave = async () => {
    if (!name.trim()) return;

    try {
      await database.write(async () => {
        if (editingRecipe) {
          await editingRecipe.update(r => {
            r.name = name.trim();
            r.description = description.trim();
            r.ingredients = ingredients;
            r.instructions = instructions.trim();
          });
        } else {
          await database.get<Recipe>('recipes').create(r => {
            r.familyId = familyId;
            r.name = name.trim();
            r.description = description.trim();
            r.ingredients = ingredients;
            r.instructions = instructions.trim();
          });
        }
      });
      resetForm();
    } catch (error) {
      log.error('Error saving recipe:', error);
      alert('Failed to save recipe');
    }
  };

  const handleDelete = (recipe: Recipe) => {
    const deleteAction = async () => {
      try {
        await database.write(async () => {
          await recipe.markAsDeleted();
        });
      } catch (error) {
        log.error('Error deleting recipe:', error);
        if (Platform.OS === 'web') {
          alert('Failed to delete recipe');
        } else {
          Alert.alert('Error', 'Failed to delete recipe');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete "${recipe.name}"?`)) {
        deleteAction();
      }
    } else {
      Alert.alert(
        "Delete Recipe",
        `Are you sure you want to delete "${recipe.name}"?`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: deleteAction
          }
        ]
      );
    }
  };

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([...ingredients, newIngredient.trim()]);
      setNewIngredient('');
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  if (isEditing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={resetForm}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{editingRecipe ? 'Edit Recipe' : 'New Recipe'}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Recipe Name"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Short description"
            multiline
          />

          <Text style={styles.label}>Ingredients</Text>
          <View style={styles.ingredientInputRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={newIngredient}
              onChangeText={setNewIngredient}
              placeholder="Add ingredient"
              onSubmitEditing={addIngredient}
            />
            <TouchableOpacity onPress={addIngredient} style={styles.addButton}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          {ingredients.map((ing, i) => (
            <View key={i} style={styles.ingredientRow}>
              <Text style={styles.ingredientText}>• {ing}</Text>
              <TouchableOpacity onPress={() => removeIngredient(i)}>
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          <Text style={[styles.label, { marginTop: 16 }]}>Instructions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Cooking instructions..."
            multiline
            numberOfLines={4}
          />
        </ScrollView>
      </View>
    );
  }

  const filteredRecipes = recipes.filter(recipe => 
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.backButton}>Close</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Recipes</Text>
        <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.createButton}>
          <Text style={styles.createButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search recipes..."
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filteredRecipes}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.recipeCard}
            onPress={() => onSelectRecipe ? onSelectRecipe(item) : handleEdit(item)}
          >
            <View style={styles.recipeInfo}>
              <Text style={styles.recipeName}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.recipeDescription} numberOfLines={1}>
                  {item.description}
                </Text>
              ) : null}
              <Text style={styles.ingredientCount}>
                {item.ingredients.length} ingredients
              </Text>
            </View>
            {!onSelectRecipe && (
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteButton}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  backButton: {
    color: '#64748B',
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 0,
    backgroundColor: '#F8FAFC',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  recipeDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  ingredientCount: {
    fontSize: 12,
    color: '#94A3B8',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  actionText: {
    color: '#4A90E2',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    color: '#EF4444',
    fontWeight: '500',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  ingredientInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ingredientText: {
    fontSize: 16,
    color: '#334155',
  },
  removeText: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: 'bold',
    padding: 4,
  },
});

export const RecipeManager = withObservables(['familyId'], ({ database, familyId }: RecipeManagerProps) => ({
  recipes: database.get<Recipe>('recipes').query(Q.where('family_id', familyId)).observe(),
}))(RecipeManagerComponent);
