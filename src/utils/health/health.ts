/**
 * Fallback (web / unsupported platforms) and the file TypeScript resolves for
 * `import ... from './health'`. Metro swaps in health.ios.ts / health.android.ts
 * at bundle time, so all three files must export the same API.
 */
import type { DailyHealthMetrics, HealthProvider } from './types';

export const healthProvider: HealthProvider = {
  async checkAvailability() {
    return { available: false, reason: 'Health sync is only available on iOS and Android.' };
  },
  async requestPermissions() {
    return false;
  },
  async readToday(): Promise<DailyHealthMetrics> {
    return { steps: 0, activeEnergyKcal: 0, totalCaloriesKcal: 0, syncedAt: new Date() };
  },
};

export const installHealthConnect = (): Promise<void> => Promise.resolve();

