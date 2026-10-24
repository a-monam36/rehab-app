/**
 * Apple HealthKit implementation (iOS only — Metro resolves this file on iOS).
 * Library: @kingstinct/react-native-healthkit (Nitro Modules)
 */
import {
  isHealthDataAvailable,
  queryStatisticsForQuantity,
  requestAuthorization,
} from '@kingstinct/react-native-healthkit';
import { Linking } from 'react-native';
import { startOfToday, type DailyHealthMetrics, type HealthProvider } from './types';

const READ_TYPES = [
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  'HKQuantityTypeIdentifierBasalEnergyBurned',
] as const;

async function sumToday(
  identifier: (typeof READ_TYPES)[number],
  unit: 'count' | 'kcal',
): Promise<number> {
  const res = await queryStatisticsForQuantity(identifier, ['cumulativeSum'], {
    filter: { date: { startDate: startOfToday(), endDate: new Date() } },
    unit,
  } as never); // unit literal is validated per-identifier by the library's generated types
  return Math.round(res.sumQuantity?.quantity ?? 0);
}

export const healthProvider: HealthProvider = {
  async checkAvailability() {
    return isHealthDataAvailable()
      ? { available: true, provider: 'Apple Health' }
      : { available: false, reason: 'Apple Health is not available on this device (e.g. iPad).' };
  },

  async requestPermissions() {
    // NOTE: For privacy, iOS never reveals whether READ access was denied —
    // denied types simply return no data.
    return requestAuthorization({ toRead: READ_TYPES });
  },

  async readToday(): Promise<DailyHealthMetrics> {
    const [steps, active, basal] = await Promise.all([
      sumToday('HKQuantityTypeIdentifierStepCount', 'count'),
      sumToday('HKQuantityTypeIdentifierActiveEnergyBurned', 'kcal'),
      sumToday('HKQuantityTypeIdentifierBasalEnergyBurned', 'kcal'),
    ]);
    return {
      steps,
      activeEnergyKcal: active,
      totalCaloriesKcal: active + basal,
      syncedAt: new Date(),
    };
  },

  openSettings() {
    // iOS has no public deep link into Health permissions; open the app's Settings page.
    Linking.openSettings();
  },
};

/** Apple Health ships with iOS — nothing to install. Kept for API parity. */
export const installHealthConnect = (): Promise<void> => Promise.resolve();
