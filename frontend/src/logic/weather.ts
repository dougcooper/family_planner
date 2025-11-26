import AsyncStorage from '@react-native-async-storage/async-storage';
import log from '../utils/logger';

const WEATHER_SETTINGS_KEY = 'weather_settings';

export interface WeatherSettings {
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
}

export interface WeatherData {
  current: {
    temperature: number;
    weatherCode: number;
  };
  daily: {
    time: string[];
    weatherCode: number[];
    temperatureMax: number[];
    temperatureMin: number[];
    precipitationProbability: number[];
    windSpeed: number[];
    humidity: number[];
  };
}

export interface CitySearchResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string; // State/Region
}

export const getWeatherSettings = async (): Promise<WeatherSettings> => {
  try {
    const json = await AsyncStorage.getItem(WEATHER_SETTINGS_KEY);
    return json ? JSON.parse(json) : {};
  } catch (e) {
    log.error('Failed to load weather settings', e);
    return {};
  }
};

export const saveWeatherSettings = async (settings: WeatherSettings) => {
  try {
    await AsyncStorage.setItem(WEATHER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    log.error('Failed to save weather settings', e);
  }
};

export const searchCity = async (query: string): Promise<CitySearchResult[]> => {
  if (!query || query.length < 2) return [];
  
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || [];
  } catch (e) {
    log.error('Error searching city', e);
    return [];
  }
};

export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData | null> => {
  try {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      current_weather: 'true',
      daily: 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max,relative_humidity_2m_max',
      timezone: 'auto',
      temperature_unit: 'fahrenheit', // Could be made configurable later
      windspeed_unit: 'mph',
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return {
      current: {
        temperature: data.current_weather.temperature,
        weatherCode: data.current_weather.weathercode,
      },
      daily: {
        time: data.daily.time,
        weatherCode: data.daily.weathercode,
        temperatureMax: data.daily.temperature_2m_max,
        temperatureMin: data.daily.temperature_2m_min,
        precipitationProbability: data.daily.precipitation_probability_max,
        windSpeed: data.daily.windspeed_10m_max,
        humidity: data.daily.relative_humidity_2m_max,
      },
    };
  } catch (e) {
    log.error('Error fetching weather', e);
    return null;
  }
};

// WMO Weather interpretation codes (WW)
// https://open-meteo.com/en/docs
export const getWeatherDescription = (code: number): string => {
  switch (code) {
    case 0: return 'Clear sky';
    case 1: return 'Mainly clear';
    case 2: return 'Partly cloudy';
    case 3: return 'Overcast';
    case 45: return 'Fog';
    case 48: return 'Depositing rime fog';
    case 51: return 'Light drizzle';
    case 53: return 'Moderate drizzle';
    case 55: return 'Dense drizzle';
    case 56: return 'Light freezing drizzle';
    case 57: return 'Dense freezing drizzle';
    case 61: return 'Slight rain';
    case 63: return 'Moderate rain';
    case 65: return 'Heavy rain';
    case 66: return 'Light freezing rain';
    case 67: return 'Heavy freezing rain';
    case 71: return 'Slight snow fall';
    case 73: return 'Moderate snow fall';
    case 75: return 'Heavy snow fall';
    case 77: return 'Snow grains';
    case 80: return 'Slight rain showers';
    case 81: return 'Moderate rain showers';
    case 82: return 'Violent rain showers';
    case 85: return 'Slight snow showers';
    case 86: return 'Heavy snow showers';
    case 95: return 'Thunderstorm';
    case 96: return 'Thunderstorm with slight hail';
    case 99: return 'Thunderstorm with heavy hail';
    default: return 'Unknown';
  }
};
