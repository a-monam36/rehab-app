import React, { memo, useCallback } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldAlert, Sparkles, RotateCcw } from 'lucide-react-native';
import {
  MUSCLE_GROUPS,
  useRehabStore,
  type MuscleGroup,
} from '../store/useRehabStore';
import { colors, radius, spacing, typography } from '../constants/theme';

/* ------------------------------ Rating labels ----------------------------- */

const ratingLabel = (v: number) =>
  v <= 2 ? 'Very weak' : v <= 4 ? 'Limited' : v <= 6 ? 'Moderate' : v <= 8 ? 'Strong' : 'Peak';

const mobilityLabel = (v: number) =>
  v <= 2 ? 'Very stiff' : v <= 4 ? 'Restricted' : v <= 6 ? 'Moderate' : v <= 8 ? 'Mobile' : 'Full ROM';

/* ------------------------------- Slider row ------------------------------- */

interface RatingSliderProps {
  label: string;
  value: number;
  color: string;
  describe: (v: number) => string;
  onChange: (v: number) => void;
  disabled?: boolean;
}

function RatingSlider({ label, value, color, describe, onChange, disabled }: RatingSliderProps) {
  const handleChange = (v: number) => {
    if (v !== value) {
      Haptics.selectionAsync().catch(() => {});
      onChange(v);
    }
  };

  return (
    <View style={styles.sliderBlock}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <View style={styles.sliderValueWrap}>
          <Text style={[styles.sliderDescriptor, { color }]}>{describe(value)}</Text>
          <Text style={styles.sliderValue}>
            {value}
            <Text style={styles.sliderMax}>/10</Text>
          </Text>
        </View>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={value}
        onValueChange={handleChange}
        minimumTrackTintColor={color}
        maximumTrackTintColor={colors.borderStrong}
        thumbTintColor={Platform.OS === 'android' ? color : undefined}
        disabled={disabled}
        accessibilityLabel={`${label} rating`}
      />
    </View>
  );
}

/* ------------------------------- Muscle card ------------------------------ */

const MuscleCard = memo(function MuscleCard({ muscle }: { muscle: MuscleGroup }) {
  const a = useRehabStore((s) => s.assessments[muscle]);
  const setStrength = useRehabStore((s) => s.setStrength);
  const setMobility = useRehabStore((s) => s.setMobility);
  const toggleRehab = useRehabStore((s) => s.toggleRehab);
  const setRehabNote = useRehabStore((s) => s.setRehabNote);

  const onToggleRehab = () => {
    Haptics.notificationAsync(
      a.rehab ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
    ).catch(() => {});
    toggleRehab(muscle);
  };

  return (
    <View style={[styles.card, a.rehab && styles.cardRehab]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{muscle}</Text>
          {a.rehab && (
            <View style={styles.rehabBadge}>
              <ShieldAlert size={12} color={colors.rehab} />
              <Text style={styles.rehabBadgeText}>Rehab</Text>
            </View>
          )}
        </View>
      </View>

      <RatingSlider
        label="Strength"
        value={a.strength}
        color={colors.strength}
        describe={ratingLabel}
        onChange={(v) => setStrength(muscle, v)}
      />
      <RatingSlider
        label="Mobility"
        value={a.mobility}
        color={colors.mobility}
        describe={mobilityLabel}
        onChange={(v) => setMobility(muscle, v)}
      />

      <View style={styles.divider} />

      <View style={styles.rehabRow}>
        <View style={styles.rehabTextWrap}>
          <Text style={styles.rehabTitle}>Rehab mode</Text>
          <Text style={styles.rehabSubtitle}>Flag an injury or pain limitation</Text>
        </View>
        <Switch
          value={a.rehab}
          onValueChange={onToggleRehab}
          trackColor={{ false: colors.borderStrong, true: colors.rehab }}
          thumbColor={Platform.OS === 'android' ? colors.textPrimary : undefined}
          ios_backgroundColor={colors.borderStrong}
          accessibilityLabel={`Rehab mode for ${muscle}`}
        />
      </View>

      {a.rehab && (
        <TextInput
          style={styles.noteInput}
          value={a.rehabNote}
          onChangeText={(t) => setRehabNote(muscle, t)}
          placeholder="Describe it (e.g. left rotator cuff strain, 3 wks)"
          placeholderTextColor={colors.textMuted}
          maxLength={120}
          returnKeyType="done"
        />
      )}
    </View>
  );
});

/* --------------------------------- Screen --------------------------------- */

export default function RatingScreen() {
  const router = useRouter();
  const assessments = useRehabStore((s) => s.assessments);
  const reset = useRehabStore((s) => s.reset);

  const values = Object.values(assessments);
  const rehabCount = values.filter((a) => a.rehab).length;
  const avgStrength = values.reduce((n, a) => n + a.strength, 0) / values.length;
  const avgMobility = values.reduce((n, a) => n + a.mobility, 0) / values.length;

  const onGenerate = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push('/workout');
  }, [router]);

  const header = (
    <View style={styles.header}>
      <Text style={styles.overline}>Assessment</Text>
      <Text style={styles.title}>Rate your body</Text>
      <Text style={styles.subtitle}>
        Score each muscle group's current strength and mobility. Flag injured areas so your AI
        plan works around them safely.
      </Text>

      <View style={styles.summaryRow}>
        <SummaryStat label="Avg strength" value={avgStrength.toFixed(1)} color={colors.strength} />
        <SummaryStat label="Avg mobility" value={avgMobility.toFixed(1)} color={colors.mobility} />
        <SummaryStat label="Rehab areas" value={String(rehabCount)} color={colors.rehab} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Muscle Rating',
          headerRight: () => (
            <Pressable onPress={reset} hitSlop={12} accessibilityLabel="Reset ratings">
              <RotateCcw size={18} color={colors.textSecondary} />
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <FlatList
          data={MUSCLE_GROUPS}
          keyExtractor={(m) => m}
          renderItem={({ item }) => <MuscleCard muscle={item} />}
          ListHeaderComponent={header}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.footer}>
          <Pressable
            onPress={onGenerate}
            style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Sparkles size={18} color={colors.accentOn} />
            <Text style={styles.ctaText}>Generate AI Plan</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SummaryStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.summaryStat}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

/* --------------------------------- Styles --------------------------------- */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  listContent: { padding: spacing.lg, paddingBottom: 120 },

  header: { marginBottom: spacing.xl, gap: spacing.sm },
  overline: { ...typography.overline, color: colors.accent },
  title: { ...typography.display, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary },

  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  summaryStat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  summaryValue: { ...typography.title, fontVariant: ['tabular-nums'] },
  summaryLabel: { ...typography.caption, color: colors.textMuted },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardRehab: { borderColor: colors.rehab, backgroundColor: '#1A1512' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { ...typography.title, color: colors.textPrimary },
  rehabBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.rehabDim,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  rehabBadgeText: { ...typography.caption, color: colors.rehab, fontWeight: '700' },

  sliderBlock: { gap: 2 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sliderLabel: { ...typography.subtitle, color: colors.textSecondary },
  sliderValueWrap: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  sliderDescriptor: { ...typography.caption },
  sliderValue: { ...typography.subtitle, color: colors.textPrimary, fontVariant: ['tabular-nums'] },
  sliderMax: { ...typography.caption, color: colors.textMuted },
  slider: { width: '100%', height: 36 },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },

  rehabRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rehabTextWrap: { flex: 1, paddingRight: spacing.md },
  rehabTitle: { ...typography.subtitle, color: colors.textPrimary },
  rehabSubtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  noteInput: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
  },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    backgroundColor: 'rgba(10, 11, 15, 0.92)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 16,
  },
  ctaText: { ...typography.subtitle, color: colors.accentOn, fontSize: 16 },
  pressed: { opacity: 0.75 },
});

