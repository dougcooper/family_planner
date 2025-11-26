import React from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, CloudFog } from 'lucide-react-native';

interface WeatherIconProps {
  code: number;
  size?: number;
  color?: string;
}

export const WeatherIcon = ({ code, size = 24, color = '#000' }: WeatherIconProps) => {
  // Map WMO codes to Lucide icons
  if (code === 0 || code === 1) return <Sun size={size} color={color} />;
  if (code === 2) return <Cloud size={size} color={color} />; // Partly cloudy
  if (code === 3) return <Cloud size={size} color={color} />; // Overcast
  if (code === 45 || code === 48) return <CloudFog size={size} color={color} />;
  if (code >= 51 && code <= 57) return <CloudDrizzle size={size} color={color} />;
  if (code >= 61 && code <= 67) return <CloudRain size={size} color={color} />;
  if (code >= 71 && code <= 77) return <CloudSnow size={size} color={color} />;
  if (code >= 80 && code <= 82) return <CloudRain size={size} color={color} />;
  if (code >= 85 && code <= 86) return <CloudSnow size={size} color={color} />;
  if (code >= 95 && code <= 99) return <CloudLightning size={size} color={color} />;
  
  return <Sun size={size} color={color} />;
};
