/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { formatDateToYYYYMMDD } from '../../src/logic/date';
// import { database } from '../../src/model/database';

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

describe('Meal Deletion Logic', () => {
  let database: Database;

  beforeEach(async () => {
    const adapter = new LokiJSAdapter({
      schema,
      useWebWorker: false,
      useIncrementalIndexedDB: true,
      dbName: 'test-deletion-' + Math.random(),
      extraLokiOptions: {
        autosave: false,
      },
    });
    database = new Database({
      adapter,
      modelClasses: [MealPlan],
    });
  });

  it('should successfully delete a meal', async () => {
    const todayStr = formatDateToYYYYMMDD(new Date());
    
    // Create a meal
    const meal = await database.write(async () => {
      return await database.get<MealPlan>('meal_plans').create(m => {
        m.familyId = 'f1';
        m.date = todayStr;
        m.mealType = 'DINNER';
        m.description = 'To Be Deleted';
      });
    });

    // Verify creation
    const countBefore = await database.collections.get<MealPlan>('meal_plans').query().fetchCount();
    expect(countBefore).toBe(1);

    // Delete the meal
    await database.write(async () => {
      await meal.markAsDeleted();
    });

    // Verify deletion
    const countAfter = await database.collections.get<MealPlan>('meal_plans').query().fetchCount();
    expect(countAfter).toBe(0);
  });
});
