/** Shared contract implemented by health.ios.ts / health.android.ts / health.ts */

export interface DailyHealthMetrics {
  /** Total step count since local midnight */
  steps: number;
  /** Active energy (kcal) – movement/exercise calories only */
  activeEnergyKcal: number;
  /** Total calories burned (kcal) = active + resting/basal */
  totalCaloriesKcal: number;
  /** When the values were read */
  syncedAt: Date;
}

export type HealthAvailability =
  | { available: true; provider: 'Apple Health' | 'Health Connect' }
  | { available: false; reason: string; canInstall?: boolean };

export interface HealthProvider {
  checkAvailability(): Promise<HealthAvailability>;
  /** Shows the OS permission sheet. Resolves true if the request completed. */
  requestPermissions(): Promise<boolean>;
  readToday(): Promise<DailyHealthMetrics>;
  /** Opens the Health Connect / Health app settings where supported */
  openSettings?(): void;
}

export const startOfToday = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

