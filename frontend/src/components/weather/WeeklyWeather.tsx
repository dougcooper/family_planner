import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { WeatherIcon } from './WeatherIcon';
import { fetchWeather, getWeatherSettings, WeatherData } from '../../logic/weather';
import { Wind, Droplets, CloudRain } from 'lucide-react-native';

export const WeeklyWeather = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWeather = async () => {
      const settings = await getWeatherSettings();
      if (settings.latitude && settings.longitude) {
        const data = await fetchWeather(settings.latitude, settings.longitude);
        setWeather(data);
      }
      setLoading(false);
    };

    loadWeather();
  }, []);

  if (loading || !weather) return null;

  const { daily } = weather;

  // Format date to day name (e.g., "Mon", "Tue")
  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Helper to get color based on weather code
  const getWeatherColor = (code: number) => {
    if (code <= 1) return '#FDB813'; // Sunny - Yellow/Orange
    if (code <= 3) return '#A0A0A0'; // Cloudy - Grey
    if (code <= 48) return '#78909C'; // Fog - Blue Grey
    if (code <= 67) return '#4FC3F7'; // Rain - Light Blue
    if (code <= 77) return '#E0F7FA'; // Snow - Very Light Blue
    if (code <= 82) return '#0288D1'; // Heavy Rain - Darker Blue
    if (code <= 86) return '#B3E5FC'; // Snow Showers
    if (code <= 99) return '#5E35B1'; // Thunderstorm - Purple
    return '#FDB813';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Forecast</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {daily.time.map((time, index) => {
          const weatherColor = getWeatherColor(daily.weatherCode[index]);
          return (
            <View key={time} style={styles.dayContainer}>
              <View style={styles.leftColumn}>
                <Text style={styles.dayName}>{getDayName(time)}</Text>
                <View style={[styles.iconContainer, { backgroundColor: `${weatherColor}20` }]}>
                  <WeatherIcon code={daily.weatherCode[index]} size={32} color={weatherColor} />
                </View>
              </View>
              
              <View style={styles.rightColumn}>
                <View style={styles.tempContainer}>
                  <Text style={styles.maxTemp}>{Math.round(daily.temperatureMax[index])}°</Text>
                  <Text style={styles.minTemp}>{Math.round(daily.temperatureMin[index])}°</Text>
                </View>

                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <CloudRain size={14} color="#64748b" />
                    <Text style={styles.detailText}>{daily.precipitationProbability[index]}%</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Wind size={14} color="#64748b" />
                    <Text style={styles.detailText}>{Math.round(daily.windSpeed[index])} mph</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Droplets size={14} color="#64748b" />
                    <Text style={styles.detailText}>{Math.round(daily.humidity[index])}%</Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1e293b',
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    gap: 12,
  },
  dayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    minWidth: 180,
  },
  leftColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    width: 60,
  },
  rightColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  dayName: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  iconContainer: {
    height: 56,
    width: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
    gap: 6,
  },
  maxTemp: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  minTemp: {
    fontSize: 16,
    color: '#94a3b8',
  },
  detailsContainer: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
});
