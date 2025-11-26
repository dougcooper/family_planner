/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Database, Q } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';

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
import { Task } from '../../src/model/models';


describe('Dashboard Reactivity', () => {
  let database: Database;

  beforeEach(async () => {
    const adapter = new LokiJSAdapter({
      schema,
      useWebWorker: false,
      useIncrementalIndexedDB: true,
      dbName: 'test-reactivity-' + Math.random(),
      extraLokiOptions: {
        autosave: false, // Disable autosave for synchronous testing control
      },
    });
    database = new Database({
      adapter,
      modelClasses: [Task],
    });
  });

  it('should emit new values when a task is created', (done) => {
    const tasksQuery = database.collections.get<Task>('tasks').query(
      Q.sortBy('created_at', Q.desc)
    );

    let emissionCount = 0;

    const subscription = tasksQuery.observe().subscribe((tasks) => {
      emissionCount++;
      
      if (emissionCount === 1) {
        // First emission: Initial state (empty)
        expect(tasks.length).toBe(0);
        
        // Trigger update
        database.write(async () => {
          await database.get<Task>('tasks').create(t => {
            t.title = 'New Task';
            t.points = 10;
            t.status = 'TODO';
            t.assigneeId = 'u1';
            t.creatorId = 'u2';
            t.familyId = 'f1';
          });
        });
      } else if (emissionCount === 2) {
        // Second emission: After creation
        expect(tasks.length).toBe(1);
        expect(tasks[0].title).toBe('New Task');
        subscription.unsubscribe();
        done();
      }
    });
  });
});
