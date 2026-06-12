import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { BfoSection, Vertical } from "@preventos/domain";
// Deep import: the decisions index pulls in node:crypto (ruleSetHash), which
// React Native lacks. The relapse module is platform-neutral.
import { daysWon } from "@preventos/decisions/src/relapse";

import type { SpendProfile } from "../core/savings";
import type { ChoreographyEvent, ChoreographyState } from "../core/pushChoreography";
import { choreographyReducer, initialChoreography } from "../core/pushChoreography";

export interface LocalEnrolment {
  readonly vertical: Vertical;
  readonly enrolledOn: string; // ISO date
  readonly quitDate?: string; // ISO date
  readonly spendProfile?: SpendProfile;
}

export interface IfThenPlan {
  readonly id: string;
  readonly vertical: Vertical;
  readonly ifTrigger: string;
  readonly thenAction: string;
}

interface AppState {
  readonly onboarded: boolean;
  readonly enrolments: readonly LocalEnrolment[];
  readonly bfoSections: readonly BfoSection[];
  readonly lapses: Readonly<Partial<Record<Vertical, readonly string[]>>>;
  readonly lastCheckinDate: string | null;
  readonly plans: readonly IfThenPlan[];
  readonly milestonesAcked: Readonly<Partial<Record<Vertical, number>>>;
  readonly choreography: ChoreographyState;
  readonly hydrated: boolean;

  enrol(enrolment: LocalEnrolment, section: BfoSection | null): void;
  recordLapse(vertical: Vertical, isoDate: string): void;
  recordCheckin(isoDate: string): void;
  addPlan(plan: IfThenPlan): void;
  ackMilestone(vertical: Vertical, daysWonNow: number): void;
  applyChoreography(event: ChoreographyEvent): void;
  setHydrated(): void;
  resetAll(): void;
}

const initial = {
  onboarded: false,
  enrolments: [] as readonly LocalEnrolment[],
  bfoSections: [] as readonly BfoSection[],
  lapses: {} as Readonly<Partial<Record<Vertical, readonly string[]>>>,
  lastCheckinDate: null as string | null,
  plans: [] as readonly IfThenPlan[],
  milestonesAcked: {} as Readonly<Partial<Record<Vertical, number>>>,
  choreography: initialChoreography,
  hydrated: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initial,

      enrol: (enrolment, section) =>
        set((s) => ({
          onboarded: true,
          enrolments: s.enrolments.some((e) => e.vertical === enrolment.vertical)
            ? s.enrolments
            : [...s.enrolments, enrolment],
          bfoSections: section ? [...s.bfoSections, section] : s.bfoSections,
        })),

      recordLapse: (vertical, isoDate) =>
        set((s) => ({
          lapses: { ...s.lapses, [vertical]: [...(s.lapses[vertical] ?? []), isoDate] },
        })),

      recordCheckin: (isoDate) => set(() => ({ lastCheckinDate: isoDate })),

      addPlan: (plan) => set((s) => ({ plans: [...s.plans, plan] })),

      ackMilestone: (vertical, daysWonNow) =>
        set((s) => ({
          milestonesAcked: {
            ...s.milestonesAcked,
            [vertical]: Math.max(s.milestonesAcked[vertical] ?? 0, daysWonNow),
          },
        })),

      applyChoreography: (event) =>
        set((s) => ({ choreography: choreographyReducer(s.choreography, event) })),

      setHydrated: () => set(() => ({ hydrated: true })),

      resetAll: () => set(() => ({ ...initial, hydrated: true })),
    }),
    {
      name: "preventos-app-state",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated: _hydrated, ...rest }) => rest,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

export const todayIso = (): string => new Date().toISOString().slice(0, 10);

/** Days won, computed through @preventos/decisions (monotone, lapse-aware). */
export const daysWonFor = (enrolment: LocalEnrolment, lapses: readonly string[], today: string): number =>
  daysWon(enrolment.enrolledOn, today, lapses);
