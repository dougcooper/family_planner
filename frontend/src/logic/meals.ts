import { Database } from '@nozbe/watermelondb';
import { GroceryItem } from '../model/models';

/**
 * Meal-to-grocery-list logic
 * Extracts ingredients from meal descriptions and adds them to the grocery list
 */

/**
 * Simple ingredient extraction logic
 * This is a basic implementation that splits on common separators
 * Can be enhanced with NLP or more sophisticated parsing
 */
function extractIngredients(mealDescription: string): string[] {
  // Common separators for ingredients
  const separators = /[,;+&\n]/g;
  
  // Split by separators and clean up
  const items = mealDescription
    .split(separators)
    .map(item => item.trim())
    .filter(item => {
      // Filter out empty strings and very short items (likely not ingredients)
      return item.length > 2;
    })
    .map(item => {
      // Remove common non-ingredient words at the start
      const cleaned = item.replace(/^(with|and|or|the|a|an)\s+/i, '');
      // Capitalize first letter
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    });

  // Remove duplicates
  return Array.from(new Set(items));
}

export async function addMealToGroceryList(
  database: Database,
  familyId: string,
  mealDescription: string
): Promise<{ success: boolean; itemsAdded: number; error?: string }> {
  try {
    const ingredients = extractIngredients(mealDescription);

    if (ingredients.length === 0) {
      return {
        success: false,
        itemsAdded: 0,
        error: 'No ingredients found in meal description',
      };
    }

    let itemsAdded = 0;

    await database.write(async () => {
      for (const ingredient of ingredients) {
        // Check if item already exists in the grocery list
        const existing = await database
          .get<GroceryItem>('grocery_items')
          .query()
          .fetch();

        const alreadyExists = existing.some(
          item => 
            item.familyId === familyId && 
            item.name.toLowerCase() === ingredient.toLowerCase() &&
            !item.isChecked
        );

        if (!alreadyExists) {
          await database.get<GroceryItem>('grocery_items').create((item) => {
            item.familyId = familyId;
            item.name = ingredient;
            item.isChecked = false;
          });
          itemsAdded++;
        }
      }
    });

    return {
      success: true,
      itemsAdded,
    };
  } catch (error) {
    console.error('Error adding meal to grocery list:', error);
    return {
      success: false,
      itemsAdded: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function bulkAddToGroceryList(
  database: Database,
  familyId: string,
  items: string[]
): Promise<{ success: boolean; itemsAdded: number; error?: string }> {
  try {
    let itemsAdded = 0;

    await database.write(async () => {
      for (const itemName of items) {
        const trimmed = itemName.trim();
        if (trimmed.length === 0) continue;

        // Check if item already exists
        const existing = await database
          .get<GroceryItem>('grocery_items')
          .query()
          .fetch();

        const alreadyExists = existing.some(
          item => 
            item.familyId === familyId && 
            item.name.toLowerCase() === trimmed.toLowerCase() &&
            !item.isChecked
        );

        if (!alreadyExists) {
          await database.get<GroceryItem>('grocery_items').create((item) => {
            item.familyId = familyId;
            item.name = trimmed;
            item.isChecked = false;
          });
          itemsAdded++;
        }
      }
    });

    return {
      success: true,
      itemsAdded,
    };
  } catch (error) {
    console.error('Error bulk adding to grocery list:', error);
    return {
      success: false,
      itemsAdded: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
