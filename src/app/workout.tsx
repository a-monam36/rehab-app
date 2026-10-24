import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  Ban,
  Clock,
  Dumbbell,
  Flame,
  HeartHandshake,
  Moon,
  RefreshCw,
  ShieldPlus,
  Snowflake,
} from 'lucide-react-native';
import { useRehabStore } from '../store/useRehabStore';
import {
  generateWorkoutPlan,
  GeminiError,
  type WorkoutExercise,
  type WorkoutPlan,
} from '../utils/gemini';
import { colors, radius, spacing, typography } from '../constants/theme';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; plan: WorkoutPlan };

const INTENSITY_COLOR: Record<WorkoutExercise['intensity'], string> = {
  low: colors.mobility,
  moderate: colors.accent,
  high: colors.rehab,
};

export default function WorkoutScreen() {
  const router = useRouter();
  const assessments = useRehabStore((s) => s.assessments);
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: 'loading' });
    try {
      const plan = await generateWorkoutPlan(Object.values(assessments), {}, controller.signal);
      if (!controller.signal.aborted) setState({ status: 'success', plan });
    } catch (e) {
      if (controller.signal.aborted) return;
      const message =
        e instanceof GeminiError ? e.message : 'Something went wrong generating your plan.';
      setState({ status: 'error', message });
    }
  }, [assessments]);

  useEffect(() => {
    generate();
    return () => abortRef.current?.abort();
    // Generate once on mount; the user can regenerate manually.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Your AI Plan',
          headerRight: () =>
            state.status !== 'loading' ? (
              <Pressable onPress={generate} hitSlop={12} accessibilityLabel="Regenerate plan">
                <RefreshCw size={18} color={colors.textSecondary} />
              </Pressable>
            ) : null,
        }}
      />

      {state.status === 'loading' && <LoadingView />}

      {state.status === 'error' && (
        <View style={styles.centered}>
          <View style={[styles.iconCircle, { backgroundColor: colors.dangerDim }]}>
            <AlertTriangle size={28} color={colors.danger} />
          </View>
          <Text style={styles.errorTitle}>Couldn't build your plan</Text>
          <Text style={styles.errorBody}>{state.message}</Text>
          <Pressable style={({ pressed }) => [styles.cta, pressed && styles.pressed]} onPress={generate}>
            <Text style={styles.ctaText}>Try again</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.linkText}>Edit ratings</Text>
          </Pressable>
        </View>
      )}

      {state.status === 'success' && <PlanView plan={state.plan} />}
    </SafeAreaView>
  );
}

/* --------------------------------- Loading -------------------------------- */

function LoadingView() {
  return (
    <View style={styles.centered}>
      <View style={[styles.iconCircle, { backgroundColor: colors.accentDim }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
      <Text style={styles.errorTitle}>Designing your session…</Text>
      <Text style={styles.errorBody}>
        Gemini is analysing your strength, mobility and rehab flags to build a safe plan.
      </Text>
    </View>
  );
}

/* ---------------------------------- Plan ---------------------------------- */

function PlanView({ plan }: { plan: WorkoutPlan }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.overline}>AI-generated session</Text>
        <Text style={styles.title}>{plan.title}</Text>
        <View style={styles.metaRow}>
          <MetaChip icon={<Clock size={14} color={colors.textSecondary} />} text={`${plan.estimatedMinutes} min`} />
          <MetaChip
            icon={<Dumbbell size={14} color={colors.textSecondary} />}
            text={`${plan.mainWorkout.length} exercises`}
          />
          {plan.rehabProtocols.length > 0 && (
            <MetaChip
              icon={<ShieldPlus size={14} color={colors.rehab} />}
              text={`${plan.rehabProtocols.length} rehab`}
              color={colors.rehab}
            />
          )}
        </View>
        <Text style={styles.summary}>{plan.summary}</Text>
      </View>

      {/* Safety first */}
      {plan.safetyWarnings.length > 0 && (
        <View style={styles.warningBox}>
          <View style={styles.warningHeader}>
            <AlertTriangle size={16} color={colors.danger} />
            <Text style={styles.warningTitle}>Safety notes</Text>
          </View>
          {plan.safetyWarnings.map((w, i) => (
            <Text key={i} style={styles.warningText}>
              • {w}
            </Text>
          ))}
        </View>
      )}

      <Section icon={<Flame size={18} color={colors.accent} />} title="Warm-up" items={plan.warmup} />
      <Section
        icon={<Dumbbell size={18} color={colors.accent} />}
        title="Main workout"
        items={plan.mainWorkout}
        numbered
      />

      {plan.rehabProtocols.map((p) => (
        <View key={p.muscle} style={styles.section}>
          <SectionHeader
            icon={<HeartHandshake size={18} color={colors.rehab} />}
            title={`Rehab · ${p.muscle}`}
            color={colors.rehab}
          />
          <View style={[styles.sectionCard, styles.rehabCard]}>
            {p.exercises.map((ex, i) => (
              <ExerciseRow key={`${ex.name}-${i}`} exercise={ex} last={i === p.exercises.length - 1} />
            ))}
            {p.avoid.length > 0 && (
              <View style={styles.avoidBox}>
                <View style={styles.warningHeader}>
                  <Ban size={14} color={colors.rehab} />
                  <Text style={[styles.avoidTitle]}>Avoid for now</Text>
                </View>
                <Text style={styles.avoidText}>{p.avoid.join(' · ')}</Text>
              </View>
            )}
            <Text style={styles.progression}>
              <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Progress when: </Text>
              {p.progressionCriteria}
            </Text>
          </View>
        </View>
      ))}

      <Section icon={<Snowflake size={18} color={colors.mobility} />} title="Cool-down" items={plan.cooldown} />

      {plan.recoveryTips.length > 0 && (
        <View style={styles.section}>
          <SectionHeader icon={<Moon size={18} color={colors.mobility} />} title="Recovery" />
          <View style={styles.sectionCard}>
            {plan.recoveryTips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={styles.tipDot} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Text style={styles.disclaimer}>
        AI-generated guidance is not medical advice. Consult a licensed physiotherapist or physician
        before training through an injury.
      </Text>
    </ScrollView>
  );
}

/* --------------------------------- Pieces --------------------------------- */

function SectionHeader({
  icon,
  title,
  color = colors.textPrimary,
}: {
  icon: React.ReactNode;
  title: string;
  color?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      {icon}
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
    </View>
  );
}

function Section({
  icon,
  title,
  items,
  numbered,
}: {
  icon: React.ReactNode;
  title: string;
  items: WorkoutExercise[];
  numbered?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionHeader icon={icon} title={title} />
      <View style={styles.sectionCard}>
        {items.map((ex, i) => (
          <ExerciseRow
            key={`${ex.name}-${i}`}
            exercise={ex}
            index={numbered ? i + 1 : undefined}
            last={i === items.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

function ExerciseRow({
  exercise,
  index,
  last,
}: {
  exercise: WorkoutExercise;
  index?: number;
  last?: boolean;
}) {
  const intensityColor = INTENSITY_COLOR[exercise.intensity];
  return (
    <View style={[styles.exerciseRow, !last && styles.exerciseDivider]}>
      {index !== undefined && (
        <View style={styles.indexBadge}>
          <Text style={styles.indexText}>{index}</Text>
        </View>
      )}
      <View style={styles.exerciseBody}>
        <View style={styles.exerciseTop}>
          <Text style={styles.exerciseName} numberOfLines={2}>
            {exercise.name}
          </Text>
          <View style={[styles.intensityPill, { borderColor: intensityColor }]}>
            <Text style={[styles.intensityText, { color: intensityColor }]}>{exercise.intensity}</Text>
          </View>
        </View>
        <Text style={styles.exerciseTarget}>{exercise.targetMuscle}</Text>
        <View style={styles.statRow}>
          <Stat label="Sets" value={String(exercise.sets)} />
          <Stat label="Reps" value={exercise.reps} />
          <Stat label="Rest" value={`${exercise.restSeconds}s`} />
        </View>
        {!!exercise.notes && <Text style={styles.exerciseNotes}>{exercise.notes}</Text>}
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MetaChip({ icon, text, color = colors.textSecondary }: { icon: React.ReactNode; text: string; color?: string }) {
  return (
    <View style={styles.metaChip}>
      {icon}
      <Text style={[styles.metaText, { color }]}>{text}</Text>
    </View>
  );
}

/* --------------------------------- Styles --------------------------------- */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.xl },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  errorTitle: { ...typography.title, color: colors.textPrimary, textAlign: 'center' },
  errorBody: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  linkText: { ...typography.subtitle, color: colors.textSecondary, marginTop: spacing.sm },

  hero: { gap: spacing.sm },
  overline: { ...typography.overline, color: colors.accent },
  title: { ...typography.display, color: colors.textPrimary },
  summary: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  metaText: { ...typography.caption },

  warningBox: {
    backgroundColor: colors.dangerDim,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 122, 0.35)',
    padding: spacing.lg,
    gap: spacing.xs,
  },
  warningHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
  warningTitle: { ...typography.subtitle, color: colors.danger },
  warningText: { ...typography.body, color: colors.textPrimary },

  section: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { ...typography.title },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  rehabCard: { borderColor: 'rgba(255, 138, 91, 0.4)', backgroundColor: '#1A1512' },

  exerciseRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.lg },
  exerciseDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: { ...typography.caption, color: colors.accent, fontWeight: '800' },
  exerciseBody: { flex: 1, gap: spacing.xs },
  exerciseTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  exerciseName: { ...typography.subtitle, color: colors.textPrimary, flex: 1 },
  exerciseTarget: { ...typography.caption, color: colors.textMuted },
  intensityPill: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  intensityText: { ...typography.caption, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' },
  statRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  statValue: { ...typography.subtitle, color: colors.textPrimary, fontVariant: ['tabular-nums'] },
  statLabel: { ...typography.caption, fontSize: 10, color: colors.textMuted },
  exerciseNotes: { ...typography.body, fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs },

  avoidBox: {
    backgroundColor: colors.rehabDim,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  avoidTitle: { ...typography.caption, color: colors.rehab, fontWeight: '700' },
  avoidText: { ...typography.body, fontSize: 13, color: colors.textPrimary },
  progression: { ...typography.body, fontSize: 13, color: colors.textSecondary, paddingVertical: spacing.md },

  tipRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.sm, alignItems: 'flex-start' },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.mobility, marginTop: 7 },
  tipText: { ...typography.body, color: colors.textPrimary, flex: 1 },

  cta: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.md,
  },
  ctaText: { ...typography.subtitle, color: colors.accentOn },
  pressed: { opacity: 0.75 },

  disclaimer: { ...typography.caption, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
});

