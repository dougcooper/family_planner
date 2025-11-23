import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Database, Q } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { formatDateToYYYYMMDD } from '../../src/logic/date';

// Mock schema creators
jest.mock('@nozbe/watermelondb', () => {
  const actual = jest.requireActual('@nozbe/watermelondb') as any;
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
import { MealPlan } from '../../src/model/models';

describe('Dashboard Duplicate Handling', () => {
  let database: Database;

  beforeEach(async () => {
    const adapter = new LokiJSAdapter({
      schema,
      useWebWorker: false,
      useIncrementalIndexedDB: true,
      dbName: 'test-duplicates-' + Math.random(),
      extraLokiOptions: {
        autosave: false,
      },
    });
    database = new Database({
      adapter,
      modelClasses: [MealPlan],
    });
  });

  it('should pick the most recently updated meal when duplicates exist', async () => {
    const todayStr = formatDateToYYYYMMDD(new Date());
    
    // Create 3 duplicate meals with different updated_at times
    await database.write(async () => {
      // Oldest
      await database.get<MealPlan>('meal_plans').create(m => {
        m.familyId = 'f1';
        m.date = todayStr;
        m.mealType = 'DINNER';
        m.description = 'Old Meal';
      });
    });
    
    await new Promise(resolve => setTimeout(resolve, 10)); // Wait 10ms

    await database.write(async () => {
      // Middle
      await database.get<MealPlan>('meal_plans').create(m => {
        m.familyId = 'f1';
        m.date = todayStr;
        m.mealType = 'DINNER';
        m.description = 'Middle Meal';
      });
    });

    await new Promise(resolve => setTimeout(resolve, 10)); // Wait 10ms

    await database.write(async () => {
      // Newest
      await database.get<MealPlan>('meal_plans').create(m => {
        m.familyId = 'f1';
        m.date = todayStr;
        m.mealType = 'DINNER';
        m.description = 'Newest Meal';
      });
    });

    // Query exactly as DashboardContainer does
    const mealPlans = await database.collections.get<MealPlan>('meal_plans').query(
      Q.where('date', todayStr),
      Q.sortBy('updated_at', Q.desc)
    ).fetch();

    // Verify we got all 3
    expect(mealPlans.length).toBe(3);

    // Verify the first one is the newest
    const dinnerMeal = mealPlans.find(m => m.mealType === 'DINNER');
    expect(dinnerMeal?.description).toBe('Newest Meal');
  });
});
