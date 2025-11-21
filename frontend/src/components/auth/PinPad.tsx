import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PinPadProps {
  onComplete: (pin: string) => void;
  onCancel?: () => void;
}

export const PinPad: React.FC<PinPadProps> = ({ onComplete, onCancel }) => {
  const [pin, setPin] = useState('');

  const handleNumberPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        onComplete(newPin);
        setPin('');
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Enter PIN</Text>
      </View>

      {/* PIN Display */}
      <View style={styles.pinDisplay}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[styles.pinDot, pin.length > i && styles.pinDotFilled]}
          />
        ))}
      </View>

      {/* Number Pad */}
      <View style={styles.numPad}>
        {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']].map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((num) => (
              <TouchableOpacity
                key={num}
                style={styles.button}
                onPress={() => handleNumberPress(num)}
              >
                <Text style={styles.buttonText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <View style={styles.row}>
          {onCancel && (
            <TouchableOpacity style={styles.button} onPress={onCancel}>
              <Text style={styles.buttonTextSmall}>Cancel</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleNumberPress('0')}
          >
            <Text style={styles.buttonText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleBackspace}>
            <Text style={styles.buttonTextSmall}>←</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  pinDisplay: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#666',
  },
  pinDotFilled: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  numPad: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 32,
    fontWeight: '600',
  },
  buttonTextSmall: {
    fontSize: 18,
    fontWeight: '600',
  },
});
