import { create } from 'zustand';

export const MUSCLE_GROUPS = [
  'Shoulders',
  'Chest',
  'Biceps',
  'Triceps',
  'Back',
  'Core',
  'Glutes',
  'Quads',
  'Hamstrings',
  'Calves',
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export interface MuscleAssessment {
  muscle: MuscleGroup;
  /** 1 (very weak) – 10 (peak strength) */
  strength: number;
  /** 1 (very restricted) – 10 (full, pain-free range of motion) */
  mobility: number;
  /** When true, the AI must treat this area as injured / limited */
  rehab: boolean;
  /** Optional free-text injury note, e.g. "left rotator cuff strain" */
  rehabNote: string;
}

interface RehabState {
  assessments: Record<MuscleGroup, MuscleAssessment>;
  setStrength: (muscle: MuscleGroup, value: number) => void;
  setMobility: (muscle: MuscleGroup, value: number) => void;
  toggleRehab: (muscle: MuscleGroup) => void;
  setRehabNote: (muscle: MuscleGroup, note: string) => void;
  reset: () => void;
}

const buildDefaults = (): Record<MuscleGroup, MuscleAssessment> =>
  MUSCLE_GROUPS.reduce(
    (acc, muscle) => {
      acc[muscle] = { muscle, strength: 5, mobility: 5, rehab: false, rehabNote: '' };
      return acc;
    },
    {} as Record<MuscleGroup, MuscleAssessment>,
  );

const clampRating = (v: number) => Math.min(10, Math.max(1, Math.round(v)));

export const useRehabStore = create<RehabState>((set) => ({
  assessments: buildDefaults(),

  setStrength: (muscle, value) =>
    set((s) => ({
      assessments: {
        ...s.assessments,
        [muscle]: { ...s.assessments[muscle], strength: clampRating(value) },
      },
    })),

  setMobility: (muscle, value) =>
    set((s) => ({
      assessments: {
        ...s.assessments,
        [muscle]: { ...s.assessments[muscle], mobility: clampRating(value) },
      },
    })),

  toggleRehab: (muscle) =>
    set((s) => ({
      assessments: {
        ...s.assessments,
        [muscle]: { ...s.assessments[muscle], rehab: !s.assessments[muscle].rehab },
      },
    })),

  setRehabNote: (muscle, note) =>
    set((s) => ({
      assessments: {
        ...s.assessments,
        [muscle]: { ...s.assessments[muscle], rehabNote: note.slice(0, 120) },
      },
    })),

  reset: () => set({ assessments: buildDefaults() }),
}));

