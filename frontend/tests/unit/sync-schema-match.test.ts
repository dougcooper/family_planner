import { describe, it, expect, jest } from '@jest/globals';

// Mock WatermelonDB functions to return the config objects directly
jest.mock('@nozbe/watermelondb', () => ({
  appSchema: (config: any) => config,
  tableSchema: (config: any) => config,
  Model: class MockModel {},
}));

// Mock decorators
jest.mock('@nozbe/watermelondb/decorators', () => {
  const mockDecorator = () => () => {};
  return {
    field: mockDecorator,
    date: mockDecorator,
    readonly: mockDecorator,
    children: mockDecorator,
    relation: mockDecorator,
    text: mockDecorator,
    writer: mockDecorator,
    immutableRelation: mockDecorator,
    json: mockDecorator,
    nochange: mockDecorator,
  };
});

import { schema } from '../../src/model/schema';
import { MealPlan } from '../../src/model/models';

// Mock the backend response format based on our toWatermelon logic
const mockBackendMealPlan = {
  id: 'test-uuid',
  family_id: 'family-uuid',
  date: '2023-11-22', // The critical format we want
  meal_type: 'DINNER',
  description: 'Pizza Night',
  created_at: 1700611200000,
  updated_at: 1700611200000,
};

describe('Sync Data Compatibility', () => {
  describe('MealPlan Schema', () => {
    it('should have columns matching the backend response keys', () => {
      // Get the table schema for meal_plans
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const tables = Array.isArray(schema.tables) ? schema.tables : Object.values(schema.tables);
      const tableSchema = tables.find((t: any) => t.name === 'meal_plans');
      expect(tableSchema).toBeDefined();

      const columns = tableSchema?.columns.map((c: any) => c.name);
      
      // Check that all keys in the mock response exist as columns (except id which is implicit)
      Object.keys(mockBackendMealPlan).forEach(key => {
        if (key === 'id') return;
        expect(columns).toContain(key);
      });
    });

    it('should have correct types for columns', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const tables = Array.isArray(schema.tables) ? schema.tables : Object.values(schema.tables);
      const tableSchema = tables.find((t: any) => t.name === 'meal_plans');
      const columnTypes = tableSchema?.columns.reduce((acc: any, c: any) => ({ ...acc, [c.name]: c.type }), {});

      expect(columnTypes).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(columnTypes['date']).toBe('string');
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(columnTypes['meal_type']).toBe('string');
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(columnTypes['description']).toBe('string');
    });
  });

  describe('MealPlan Model', () => {
    // We can't easily inspect decorators at runtime in Jest without setup, 
    // but we can check if the class properties align with our expectations conceptually.
    // This is more of a sanity check.
    
    it('should define the table name correctly', () => {
      expect(MealPlan.table).toBe('meal_plans');
    });
  });
});
