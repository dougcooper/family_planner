import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { Event } from '../../model/models';
import dayjs from 'dayjs';

interface EventItemProps {
  event: Event;
  color: string;
  isAllDay?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const EventItem: React.FC<EventItemProps> = ({
  event,
  color,
  isAllDay,
  onPress,
  style,
}) => {
  const startTime = dayjs(event.startTime).format('h:mm A');
  const endTime = dayjs(event.endTime).format('h:mm A');

  return (
    <Animated.View style={[style, styles.wrapper]}>
      <TouchableOpacity 
        style={[styles.container, { borderLeftColor: color }]} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
          {!isAllDay && (
            <Text style={styles.time}>{startTime} - {endTime}</Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderLeftWidth: 4,
    padding: 4,
    borderRadius: 4,
    overflow: 'hidden',
    // Shadow for better visibility
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#333',
  },
  time: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
});
