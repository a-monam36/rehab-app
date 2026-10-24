import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Activity, Flame, Footprints, HeartPulse, RefreshCw } from 'lucide-react-native';
import { healthProvider, installHealthConnect } from '../utils/health/health';
import type { DailyHealthMetrics, HealthAvailability } from '../utils/health/types';
import { colors, radius, spacing, typography } from '../constants/theme';

type SyncStatus = 'checking' | 'unavailable' | 'needs-permission' | 'syncing' | 'ready' | 'error';

interface HealthSyncProps {
  /** Daily step goal used for the progress bar */
  stepGoal?: number;
  /** Called after every successful sync (e.g. to persist or send to your backend) */
  onSync?: (metrics: DailyHealthMetrics) => void;
}

export default function HealthSync({ stepGoal = 10_000, onSync }: HealthSyncProps) {
  const [status, setStatus] = useState<SyncStatus>('checking');
  const [availability, setAvailability] = useState<HealthAvailability | null>(null);
  const [metrics, setMetrics] = useState<DailyHealthMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(async () => {
    setStatus('syncing');
    setError(null);
    try {
      const data = await healthProvider.readToday();
      setMetrics(data);
      setStatus('ready');
      onSync?.(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to read health data.');
      setStatus('error');
    }
  }, [onSync]);

  const checkAvailability = useCallback(async () => {
    try {
      const result = await healthProvider.checkAvailability();
      setAvailability(result);
      setStatus(result.available ? 'needs-permission' : 'unavailable');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to reach health services.');
      setStatus('error');
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      const ok = await healthProvider.requestPermissions();
      if (ok) await sync();
      else setStatus('needs-permission');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Permission request failed.');
      setStatus('error');
    }
  }, [sync]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  // Refresh when the app returns to the foreground (e.g. after a walk, or after
  // the user installs Health Connect / changes permissions in Settings).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      if (status === 'ready') sync();
      else if (status === 'unavailable') checkAvailability();
    });
    return () => sub.remove();
  }, [status, sync, checkAvailability]);

  const providerName =
    availability?.available === true
      ? availability.provider
      : Platform.OS === 'ios'
        ? 'Apple Health'
        : 'Health Connect';

  /* ------------------------------ Render states ----------------------------- */

  const renderBody = () => {
    if (status === 'checking') {
      return <ActivityIndicator color={colors.accent} style={styles.loader} />;
    }

    if (status === 'unavailable' && availability && availability.available === false) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{availability.reason}</Text>
          {availability.canInstall && (
            <PrimaryButton label="Get Health Connect" onPress={installHealthConnect} />
          )}
        </View>
      );
    }

    if (status === 'needs-permission') {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Connect {providerName} to sync your steps, calories burned and active energy.
          </Text>
          <PrimaryButton label={`Connect ${providerName}`} onPress={connect} />
        </View>
      );
    }

    if (status === 'error') {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.danger }]}>{error}</Text>
          <PrimaryButton label="Try again" onPress={metrics ? sync : connect} />
        </View>
      );
    }

    const m = metrics ?? { steps: 0, activeEnergyKcal: 0, totalCaloriesKcal: 0, syncedAt: new Date() };
    const stepProgress = Math.min(1, m.steps / stepGoal);

    return (
      <>
        <View style={styles.stepsBlock}>
          <View style={styles.stepsHeader}>
            <Footprints size={18} color={colors.accent} />
            <Text style={styles.metricLabel}>Steps</Text>
          </View>
          <Text style={styles.stepsValue}>{m.steps.toLocaleString()}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${stepProgress * 100}%` }]} />
          </View>
          <Text style={styles.goalText}>
            {Math.round(stepProgress * 100)}% of {stepGoal.toLocaleString()} goal
          </Text>
        </View>

        <View style={styles.metricRow}>
          <MetricTile
            icon={<Flame size={18} color={colors.rehab} />}
            label="Calories Burned"
            value={m.totalCaloriesKcal}
            unit="kcal"
            tint={colors.rehabDim}
          />
          <MetricTile
            icon={<Activity size={18} color={colors.mobility} />}
            label="Active Energy"
            value={m.activeEnergyKcal}
            unit="kcal"
            tint={colors.mobilityDim}
          />
        </View>

        <Text style={styles.syncedAt}>
          Synced {m.syncedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </Text>
      </>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBadge}>
            <HeartPulse size={18} color={colors.accent} />
          </View>
          <View>
            <Text style={styles.overline}>Today</Text>
            <Text style={styles.title}>{providerName}</Text>
          </View>
        </View>
        {(status === 'ready' || status === 'syncing') && (
          <Pressable
            onPress={sync}
            disabled={status === 'syncing'}
            hitSlop={12}
            style={({ pressed }) => [styles.refreshBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Refresh health data"
          >
            {status === 'syncing' ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <RefreshCw size={16} color={colors.textSecondary} />
            )}
          </Pressable>
        )}
      </View>
      {renderBody()}
    </View>
  );
}

/* --------------------------------- Pieces --------------------------------- */

function MetricTile({
  icon,
  label,
  value,
  unit,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  tint: string;
}) {
  return (
    <View style={[styles.tile, { backgroundColor: tint }]}>
      {icon}
      <Text style={styles.tileValue}>
        {value.toLocaleString()}
        <Text style={styles.tileUnit}> {unit}</Text>
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

/* --------------------------------- Styles --------------------------------- */

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overline: { ...typography.overline, color: colors.textMuted },
  title: { ...typography.subtitle, color: colors.textPrimary },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: { paddingVertical: spacing.xl },
  emptyState: { gap: spacing.md, paddingVertical: spacing.sm },
  emptyText: { ...typography.body, color: colors.textSecondary },
  stepsBlock: { gap: spacing.sm },
  stepsHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepsValue: {
    ...typography.display,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.accent },
  goalText: { ...typography.caption, color: colors.textMuted },
  metricRow: { flexDirection: 'row', gap: spacing.md },
  tile: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  tileValue: {
    ...typography.title,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  tileUnit: { ...typography.caption, color: colors.textSecondary },
  metricLabel: { ...typography.caption, color: colors.textSecondary },
  syncedAt: { ...typography.caption, color: colors.textMuted, textAlign: 'right' },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { ...typography.subtitle, color: colors.accentOn },
  pressed: { opacity: 0.7 },
});
