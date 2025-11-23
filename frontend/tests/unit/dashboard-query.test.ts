import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Database, Q } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';

// Debug exports
// console.log('WatermelonDB exports:', require('@nozbe/watermelondb'));

// Mock schema creators to return simple objects, as the real ones might fail in Jest environment
jest.mock('@nozbe/watermelondb', () => {
  const actual = jest.requireActual('@nozbe/watermelondb') as any;
  // If actual.appSchema is undefined, we are in trouble.
  // Let's try to use the real ones if they exist, otherwise mock.
  if (actual.appSchema) {
      return actual;
  }
  return {
    ...actual,
    appSchema: (config: any) => ({ ...config, version: config.version || 1 }),
    tableSchema: (config: any) => config,
  };
});

import { schema } from '../../src/model/schema';
// ...existing code...
import { MealPlan } from '../../src/model/models';
import { formatDateToYYYYMMDD } from '../../src/logic/date';

describe('Dashboard Query Logic', () => {
  let database: Database;

  beforeEach(async () => {
    const adapter = new LokiJSAdapter({
      schema,
      useWebWorker: false,
      useIncrementalIndexedDB: true,
      dbName: 'test-db-' + Math.random(),
      extraLokiOptions: {
        autosave: false,
      },
    });
    database = new Database({
      adapter,
      modelClasses: [MealPlan],
    });
  });

  it('should find today\'s dinner', async () => {
    const today = new Date();
    const todayStr = formatDateToYYYYMMDD(today);
    
    // Create a meal plan
    await database.write(async () => {
      await database.get<MealPlan>('meal_plans').create(meal => {
        meal.familyId = 'test-family';
        meal.date = todayStr;
        meal.mealType = 'DINNER';
        meal.description = 'Test Dinner';
      });
    });

    // Run the query exactly as it appears in DashboardContainer (now with family_id)
    const mealPlans = await database.collections.get<MealPlan>('meal_plans').query(
      Q.where('family_id', 'test-family'),
      Q.where('date', todayStr)
    ).fetch();

    // Component logic simulation
    const dinnerMeal = mealPlans.find(m => m.mealType === 'DINNER');

    expect(mealPlans.length).toBe(1);
    expect(dinnerMeal).toBeDefined();
    expect(dinnerMeal?.description).toBe('Test Dinner');
  });

  it('should NOT find lunch when querying for dinner', async () => {
    const today = new Date();
    const todayStr = formatDateToYYYYMMDD(today);
    
    // Create a lunch plan
    await database.write(async () => {
      await database.get<MealPlan>('meal_plans').create(meal => {
        meal.familyId = 'test-family';
        meal.date = todayStr;
        meal.mealType = 'LUNCH';
        meal.description = 'Test Lunch';
      });
    });

    // Run the query
    const mealPlans = await database.collections.get<MealPlan>('meal_plans').query(
      Q.where('date', todayStr)
    ).fetch();

    // Component logic simulation
    const dinnerMeal = mealPlans.find(m => m.mealType === 'DINNER');

    expect(mealPlans.length).toBe(1); // Found the lunch
    expect(dinnerMeal).toBeUndefined(); // But it's not dinner
  });
});
