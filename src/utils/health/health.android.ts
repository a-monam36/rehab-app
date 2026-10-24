/**
 * Android implementation via Health Connect (Metro resolves this file on Android).
 *
 * Google Fit's APIs are deprecated and being shut down by Google; Health Connect
 * is the official replacement and also receives data that Google Fit, Samsung
 * Health, Fitbit, etc. write to it.
 */
import { Linking } from 'react-native';
import {
  aggregateRecord,
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  openHealthConnectSettings,
  requestPermission,
  SdkAvailabilityStatus,
  type Permission,
} from 'react-native-health-connect';
import {
  startOfToday,
  type DailyHealthMetrics,
  type HealthAvailability,
  type HealthProvider,
} from './types';

const PERMISSIONS: Permission[] = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'TotalCaloriesBurned' },
];

let initialized = false;
async function ensureInitialized() {
  if (!initialized) initialized = await initialize();
  if (!initialized) throw new Error('Health Connect failed to initialize.');
}

const todayFilter = () => ({
  operator: 'between' as const,
  startTime: startOfToday().toISOString(),
  endTime: new Date().toISOString(),
});

export const healthProvider: HealthProvider = {
  async checkAvailability(): Promise<HealthAvailability> {
    const status = await getSdkStatus();
    if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
      return { available: true, provider: 'Health Connect' };
    }
    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
      return { available: false, reason: 'Health Connect needs an update.', canInstall: true };
    }
    return { available: false, reason: 'Health Connect is not installed.', canInstall: true };
  },

  async requestPermissions() {
    await ensureInitialized();
    const granted = await requestPermission(PERMISSIONS);
    return granted.length > 0;
  },

  async readToday(): Promise<DailyHealthMetrics> {
    await ensureInitialized();

    // Only query record types the user actually granted, otherwise HC throws.
    const granted = new Set(
      (await getGrantedPermissions())
        .filter((p) => 'recordType' in p && p.accessType === 'read')
        .map((p) => (p as Permission).recordType),
    );

    const [steps, active, total] = await Promise.all([
      granted.has('Steps')
        ? aggregateRecord({ recordType: 'Steps', timeRangeFilter: todayFilter() })
        : null,
      granted.has('ActiveCaloriesBurned')
        ? aggregateRecord({ recordType: 'ActiveCaloriesBurned', timeRangeFilter: todayFilter() })
        : null,
      granted.has('TotalCaloriesBurned')
        ? aggregateRecord({ recordType: 'TotalCaloriesBurned', timeRangeFilter: todayFilter() })
        : null,
    ]);

    return {
      steps: Math.round(steps?.COUNT_TOTAL ?? 0),
      activeEnergyKcal: Math.round(active?.ACTIVE_CALORIES_TOTAL.inKilocalories ?? 0),
      totalCaloriesKcal: Math.round(total?.ENERGY_TOTAL.inKilocalories ?? 0),
      syncedAt: new Date(),
    };
  },

  openSettings() {
    openHealthConnectSettings();
  },
};

/** Opens the Play Store listing so the user can install/update Health Connect. */
export const installHealthConnect = () =>
  Linking.openURL('market://details?id=com.google.android.apps.healthdata');

