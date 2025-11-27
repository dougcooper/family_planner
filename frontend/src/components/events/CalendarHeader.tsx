import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import dayjs from 'dayjs';

export type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: CalendarViewMode;
  onViewChange: (mode: CalendarViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  viewMode,
  onViewChange,
  onPrev,
  onNext,
  onToday,
}) => {
  const formatDate = () => {
    const date = dayjs(currentDate);
    if (viewMode === 'month') {
      return date.format('MMMM YYYY');
    } else if (viewMode === 'week') {
      const start = date.startOf('week');
      const end = date.endOf('week');
      if (start.month() === end.month()) {
        return `${start.format('MMM D')} - ${end.format('D, YYYY')}`;
      }
      return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`;
    } else {
      return date.format('MMMM D, YYYY');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerTop}>
        <View style={styles.navigation}>
          <TouchableOpacity onPress={onPrev} style={styles.iconButton} testID="prev-button">
            <ChevronLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.dateText}>{formatDate()}</Text>
          <TouchableOpacity onPress={onNext} style={styles.iconButton} testID="next-button">
            <ChevronRight size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onToday} style={styles.todayButton}>
          <Text style={styles.todayText}>Today</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.viewSelector}>
        {(['month', 'week', 'day', 'agenda'] as CalendarViewMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.viewOption,
              viewMode === mode && styles.viewOptionActive,
            ]}
            onPress={() => onViewChange(mode)}
          >
            <Text
              style={[
                styles.viewOptionText,
                viewMode === mode && styles.viewOptionTextActive,
              ]}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 5,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 10,
    color: '#333',
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
  },
  todayText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    padding: 2,
  },
  viewOption: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  viewOptionActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  viewOptionText: {
    fontSize: 13,
    color: '#666',
  },
  viewOptionTextActive: {
    color: '#333',
    fontWeight: '600',
  },
});
