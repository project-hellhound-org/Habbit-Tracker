import React from 'react';
import { ForestTheme, AppSettings } from '../db/schema';
import { EnvironmentEngine } from './EnvironmentEngine';

interface EnvironmentalBackgroundProps {
  theme: ForestTheme;
  settings?: AppSettings;
}

export const EnvironmentalBackground: React.FC<EnvironmentalBackgroundProps> = ({ theme, settings }) => {
  return <EnvironmentEngine theme={theme} settings={settings} />;
};
