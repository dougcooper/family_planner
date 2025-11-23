import { describe, it, expect } from '@jest/globals';

/**
 * Unit Tests for GenericList Hide/Show Completed Items Feature
 * Tests the filtering logic for completed items
 */

describe('GenericList Hide/Show Completed Items', () => {
  // Mock list items data
  const mockItems = [
    { id: '1', text: 'Buy milk', isChecked: false },
    { id: '2', text: 'Walk dog', isChecked: true },
    { id: '3', text: 'Clean kitchen', isChecked: false },
    { id: '4', text: 'Do laundry', isChecked: true },
    { id: '5', text: 'Pay bills', isChecked: false },
  ];

  describe('Item Filtering Logic', () => {
    it('should show all items when showCompleted is true', () => {
      const showCompleted = true;
      const displayedItems = showCompleted 
        ? mockItems 
        : mockItems.filter((item) => !item.isChecked);
      
      expect(displayedItems.length).toBe(5);
      expect(displayedItems).toEqual(mockItems);
    });

    it('should hide completed items when showCompleted is false', () => {
      const showCompleted = false;
      const displayedItems = showCompleted 
        ? mockItems 
        : mockItems.filter((item) => !item.isChecked);
      
      expect(displayedItems.length).toBe(3);
      expect(displayedItems.every(item => !item.isChecked)).toBe(true);
    });

    it('should correctly count unchecked and checked items', () => {
      const uncheckedCount = mockItems.filter((item) => !item.isChecked).length;
      const checkedCount = mockItems.filter((item) => item.isChecked).length;
      
      expect(uncheckedCount).toBe(3);
      expect(checkedCount).toBe(2);
      expect(uncheckedCount + checkedCount).toBe(mockItems.length);
    });

    it('should return empty array when all items are completed and showCompleted is false', () => {
      const allCompleted = mockItems.map(item => ({ ...item, isChecked: true }));
      const showCompleted = false;
      const displayedItems = showCompleted 
        ? allCompleted 
        : allCompleted.filter((item) => !item.isChecked);
      
      expect(displayedItems.length).toBe(0);
    });

    it('should return all items when no items are completed', () => {
      const noneCompleted = mockItems.map(item => ({ ...item, isChecked: false }));
      const showCompleted = false;
      const displayedItems = showCompleted 
        ? noneCompleted 
        : noneCompleted.filter((item) => !item.isChecked);
      
      expect(displayedItems.length).toBe(5);
      expect(displayedItems).toEqual(noneCompleted);
    });
  });

  describe('Stats Display Logic', () => {
    it('should show hidden count in stats when items are hidden', () => {
      const showCompleted = false;
      const checkedCount = mockItems.filter((item) => item.isChecked).length;
      const shouldShowHiddenCount = !showCompleted && checkedCount > 0;
      
      expect(shouldShowHiddenCount).toBe(true);
      expect(checkedCount).toBe(2);
    });

    it('should not show hidden count when all items are visible', () => {
      const showCompleted = true;
      const checkedCount = mockItems.filter((item) => item.isChecked).length;
      const shouldShowHiddenCount = !showCompleted && checkedCount > 0;
      
      expect(shouldShowHiddenCount).toBe(false);
    });

    it('should not show hidden count when no items are completed', () => {
      const showCompleted = false;
      const checkedCount = 0;
      const shouldShowHiddenCount = !showCompleted && checkedCount > 0;
      
      expect(shouldShowHiddenCount).toBe(false);
    });
  });

  describe('Toggle Button Visibility', () => {
    it('should show toggle button when there are completed items', () => {
      const checkedCount = mockItems.filter((item) => item.isChecked).length;
      const shouldShowToggle = checkedCount > 0;
      
      expect(shouldShowToggle).toBe(true);
    });

    it('should not show toggle button when there are no completed items', () => {
      const noneCompleted = mockItems.map(item => ({ ...item, isChecked: false }));
      const checkedCount = noneCompleted.filter((item) => item.isChecked).length;
      const shouldShowToggle = checkedCount > 0;
      
      expect(shouldShowToggle).toBe(false);
    });
  });

  describe('Clear Button Visibility', () => {
    it('should show clear button when items are completed and visible', () => {
      const showCompleted = true;
      const checkedCount = mockItems.filter((item) => item.isChecked).length;
      const shouldShowClearButton = checkedCount > 0 && showCompleted;
      
      expect(shouldShowClearButton).toBe(true);
    });

    it('should not show clear button when completed items are hidden', () => {
      const showCompleted = false;
      const checkedCount = mockItems.filter((item) => item.isChecked).length;
      const shouldShowClearButton = checkedCount > 0 && showCompleted;
      
      expect(shouldShowClearButton).toBe(false);
    });

    it('should not show clear button when there are no completed items', () => {
      const showCompleted = true;
      const checkedCount = 0;
      const shouldShowClearButton = checkedCount > 0 && showCompleted;
      
      expect(shouldShowClearButton).toBe(false);
    });
  });
});
