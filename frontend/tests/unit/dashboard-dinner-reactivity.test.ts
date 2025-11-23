import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Database, Q } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { formatDateToYYYYMMDD, getStartOfWeek } from '../../src/logic/date';

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

describe('Dashboard Dinner Reactivity', () => {
  let database: Database;

  beforeEach(async () => {
    const adapter = new LokiJSAdapter({
      schema,
      useWebWorker: false,
      useIncrementalIndexedDB: true,
      dbName: 'test-dinner-' + Math.random(),
      extraLokiOptions: {
        autosave: false,
      },
    });
    database = new Database({
      adapter,
      modelClasses: [MealPlan],
    });
  });

  it('should emit today\'s dinner when created via MealPlanner logic', (done) => {
    // Dashboard logic: Query for today
    const todayStr = formatDateToYYYYMMDD(new Date());
    // eslint-disable-next-line no-console
    console.log('Dashboard querying for:', todayStr);

    const mealQuery = database.collections.get<MealPlan>('meal_plans').query(
      Q.where('date', todayStr)
    );

    let emissionCount = 0;

    const subscription = mealQuery.observe().subscribe((meals) => {
      emissionCount++;
      // eslint-disable-next-line no-console
      console.log(`Emission ${emissionCount}: ${meals.length} meals`);
      
      if (emissionCount === 1) {
        // First emission: Initial state (empty)
        expect(meals.length).toBe(0);
        
        // Trigger update: Create a dinner using MealPlanner logic
        database.write(async () => {
          // MealPlanner logic: Calculate date from start of week
          const startOfWeek = getStartOfWeek();
          const today = new Date();
          const dayDiff = Math.floor((today.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24));
          
          // Reconstruct the date exactly as MealPlanner does loop
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + dayDiff);
          const dateStr = formatDateToYYYYMMDD(date);
          
          // eslint-disable-next-line no-console
          console.log('MealPlanner saving for:', dateStr);

          await database.get<MealPlan>('meal_plans').create(m => {
            m.familyId = 'f1';
            m.date = dateStr;
            m.mealType = 'DINNER';
            m.description = 'Pizza Night';
          });
        });
      } else if (emissionCount === 2) {
        // Second emission: Should contain the dinner
        const dinner = meals.find(m => m.mealType === 'DINNER');
        expect(dinner).toBeDefined();
        expect(dinner?.description).toBe('Pizza Night');
        subscription.unsubscribe();
        done();
      }
    });
  });
});
