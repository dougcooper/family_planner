import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WeatherIcon } from './WeatherIcon';
import { fetchWeather, getWeatherSettings, WeatherData, getWeatherDescription } from '../../logic/weather';

export const WeatherBanner = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWeather = async () => {
      const settings = await getWeatherSettings();
      if (settings.city) {
        setLocationName(settings.city);
      }
      if (settings.latitude && settings.longitude) {
        const data = await fetchWeather(settings.latitude, settings.longitude);
        setWeather(data);
      }
      setLoading(false);
    };

    loadWeather();
  }, []);

  if (loading || !weather) return null;

  const { current } = weather;

  return (
    <View style={styles.container}>
      {locationName ? <Text style={styles.location}>{locationName}</Text> : null}
      <WeatherIcon code={current.weatherCode} size={20} color="#ffffff" />
      <Text style={styles.temp}>{Math.round(current.temperature)}°F</Text>
      <Text style={styles.desc}>{getWeatherDescription(current.weatherCode)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  location: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 8,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.3)',
    paddingRight: 8,
  },
  temp: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  desc: {
    color: '#ffffff',
    fontSize: 13,
    marginLeft: 6,
    opacity: 0.9,
  },
});
