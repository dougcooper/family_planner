import React, { useEffect, useMemo } from 'react';
import { Animated, Text, StyleSheet, Platform } from 'react-native';

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  duration?: number;
  type?: 'success' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  visible, 
  onHide, 
  duration = 3000,
  type = 'success' 
}) => {
  const opacity = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.delay(duration),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(({ finished }) => {
        if (finished) {
          onHide();
        }
      });
    }
  }, [visible, duration, opacity, onHide, message]);

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { opacity },
        type === 'error' ? styles.error : styles.success,
        Platform.OS === 'web' ? { pointerEvents: 'none' } : undefined,
      ]}
      pointerEvents={Platform.OS === 'web' ? undefined : 'none'}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Move to top, account for status bar/header
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 10, // Increase elevation
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
  },
  success: {
    backgroundColor: '#10B981', // Green
  },
  error: {
    backgroundColor: '#EF4444', // Red
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
