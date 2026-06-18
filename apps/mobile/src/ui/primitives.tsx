import type { ReactNode } from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { Pressable, Text as RNText, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { color, radius, shadow, space, type } from "./tokens";

type Variant = keyof typeof type;

interface TextProps {
  readonly variant?: Variant;
  readonly color?: string;
  readonly style?: StyleProp<TextStyle>;
  readonly testID?: string;
  readonly children: ReactNode;
}

export function Text({ variant = "body", color: ink = color.ink, style, testID, children }: TextProps) {
  return (
    <RNText testID={testID} style={[type[variant] as TextStyle, { color: ink }, style]}>
      {children}
    </RNText>
  );
}

interface ButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly kind?: "primary" | "secondary" | "success" | "rescue" | "crisis" | "ghost";
  readonly disabled?: boolean;
  readonly testID?: string;
}

const buttonStyles: Record<NonNullable<ButtonProps["kind"]>, { bg: string; fg: string; border?: string }> = {
  primary: { bg: color.primary, fg: color.onPrimary },
  secondary: { bg: color.primarySoft, fg: color.primary },
  success: { bg: color.success, fg: color.onPrimary },
  rescue: { bg: color.rescue, fg: color.onRescue },
  crisis: { bg: color.crisisAction, fg: color.onCrisisAction },
  ghost: { bg: "transparent", fg: color.inkMuted, border: color.border },
};

export function Button({ label, onPress, kind = "primary", disabled = false, testID }: ButtonProps) {
  const s = buttonStyles[kind];
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: s.bg, opacity: disabled ? 0.4 : pressed ? 0.82 : 1 },
        pressed && !disabled ? { transform: [{ scale: 0.99 }] } : null,
        s.border ? { borderWidth: 1, borderColor: s.border } : null,
      ]}
    >
      <RNText style={[type.bodyStrong as TextStyle, { color: s.fg }]}>{label}</RNText>
    </Pressable>
  );
}

interface CardProps {
  readonly children: ReactNode;
  readonly tone?: "surface" | "soft" | "accent" | "peach" | "success" | "rescue";
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

const cardTones = {
  surface: color.surface,
  soft: color.primarySoft,
  accent: color.accentSoft,
  peach: color.peachSoft,
  success: color.successSoft,
  rescue: color.rescueSoft,
} as const;

export function Card({ children, tone = "surface", style, testID }: CardProps) {
  return (
    <View testID={testID} style={[styles.card, { backgroundColor: cardTones[tone] }, style]}>
      {children}
    </View>
  );
}

interface ScreenProps {
  readonly children: ReactNode;
  readonly background?: string;
  readonly testID?: string;
}

export function Screen({ children, background = color.background, testID }: ScreenProps) {
  return (
    <SafeAreaView testID={testID} style={[styles.screen, { backgroundColor: background }]}>
      {children}
    </SafeAreaView>
  );
}

interface OptionRowProps {
  readonly label: string;
  readonly selected: boolean;
  readonly onPress: () => void;
  readonly detail?: string;
  readonly testID?: string;
}

/** Tap-to-answer row used for instrument items and intake questions. */
export function OptionRow({ label, selected, onPress, detail, testID }: OptionRowProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionRow,
        selected ? styles.optionRowSelected : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={[styles.radioDot, selected ? styles.radioDotSelected : null]} />
      <View style={styles.optionText}>
        <RNText style={[type.bodyStrong as TextStyle, { color: selected ? color.primary : color.ink }]}>
          {label}
        </RNText>
        {detail ? (
          <RNText style={[type.caption as TextStyle, { color: color.inkMuted }]}>{detail}</RNText>
        ) : null}
      </View>
    </Pressable>
  );
}

interface ChipProps {
  readonly label: string;
  readonly tone?: "primary" | "success" | "peach" | "muted";
  readonly testID?: string;
}

const chipTones = {
  primary: { bg: color.primarySoft, fg: color.primary },
  success: { bg: color.successSoft, fg: color.success },
  peach: { bg: color.peachSoft, fg: color.accent },
  muted: { bg: color.surfaceSunken, fg: color.inkMuted },
} as const;

export function ProgrammeChip({ label, tone = "peach", testID }: ChipProps) {
  const s = chipTones[tone];
  return (
    <View testID={testID} style={[styles.chip, { backgroundColor: s.bg }]}>
      <RNText style={[type.caption as TextStyle, styles.chipText, { color: s.fg }]}>{label}</RNText>
    </View>
  );
}

interface ActionCardProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
  readonly actionLabel: string;
  readonly onPress: () => void;
  readonly actionTestID?: string;
  readonly testID?: string;
}

export function ActionCard({ eyebrow, title, body, actionLabel, onPress, actionTestID, testID }: ActionCardProps) {
  return (
    <Card testID={testID} style={styles.actionCard}>
      <ProgrammeChip label={eyebrow} tone="primary" />
      <View style={{ height: space.sm }} />
      <Text variant="heading">{title}</Text>
      <View style={{ height: space.xs }} />
      <Text variant="body" color={color.inkMuted}>
        {body}
      </Text>
      <View style={{ height: space.md }} />
      <Button testID={actionTestID} label={actionLabel} onPress={onPress} />
    </Card>
  );
}

interface ProgressMetricProps {
  readonly label: string;
  readonly value: string;
  readonly detail?: string;
  readonly tone?: CardProps["tone"];
  readonly valueTestID?: string;
  readonly testID?: string;
}

export function ProgressMetric({ label, value, detail, tone = "surface", valueTestID, testID }: ProgressMetricProps) {
  return (
    <Card tone={tone} style={styles.metric} testID={testID}>
      <Text variant="caption" color={tone === "success" ? color.success : color.inkMuted}>
        {label}
      </Text>
      <View style={{ height: space.xs }} />
      <Text variant="title" testID={valueTestID}>
        {value}
      </Text>
      {detail ? (
        <>
          <View style={{ height: space.xs }} />
          <Text variant="caption" color={color.inkMuted}>
            {detail}
          </Text>
        </>
      ) : null}
    </Card>
  );
}

interface SegmentedControlProps<T extends string> {
  readonly options: ReadonlyArray<{ readonly label: string; readonly value: T }>;
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly testID?: string;
}

export function SegmentedControl<T extends string>({ options, value, onChange, testID }: SegmentedControlProps<T>) {
  return (
    <View testID={testID} style={styles.segmented}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              selected ? styles.segmentSelected : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <RNText style={[type.caption as TextStyle, { color: selected ? color.onPrimary : color.inkMuted }]}>
              {option.label}
            </RNText>
          </Pressable>
        );
      })}
    </View>
  );
}

interface SafetyInterruptionProps {
  readonly title: string;
  readonly body: string;
  readonly actionLabel: string;
  readonly onPress: () => void;
  readonly testID?: string;
}

export function SafetyInterruption({ title, body, actionLabel, onPress, testID }: SafetyInterruptionProps) {
  return (
    <View testID={testID} style={styles.safety}>
      <Text variant="heading" color={color.crisisInk}>
        {title}
      </Text>
      <View style={{ height: space.xs }} />
      <Text variant="body" color={color.crisisInkMuted}>
        {body}
      </Text>
      <View style={{ height: space.md }} />
      <Button label={actionLabel} kind="crisis" onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  actionCard: {
    borderColor: color.primarySoft,
    borderWidth: 1,
  },
  button: {
    alignItems: "center",
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    paddingVertical: 14,
  },
  card: {
    borderRadius: radius.lg,
    padding: space.md,
    ...shadow.card,
  },
  chip: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 5,
  },
  chipText: {
    fontWeight: "700",
    textTransform: "uppercase",
  },
  metric: {
    flex: 1,
    minHeight: 112,
  },
  optionRow: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: radius.md,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: space.sm,
    marginBottom: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: 14,
  },
  optionRowSelected: {
    backgroundColor: color.primarySoft,
    borderColor: color.primary,
  },
  optionText: { flex: 1, gap: 2 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  radioDot: {
    borderColor: color.border,
    borderRadius: 7,
    borderWidth: 2,
    height: 14,
    width: 14,
  },
  radioDotSelected: {
    backgroundColor: color.primary,
    borderColor: color.primary,
  },
  screen: {
    flex: 1,
    paddingHorizontal: space.md,
  },
  safety: {
    backgroundColor: color.crisisSurface,
    borderColor: color.crisisAction,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: space.md,
  },
  segment: {
    alignItems: "center",
    borderRadius: radius.pill,
    flex: 1,
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
  },
  segmentSelected: {
    backgroundColor: color.primary,
  },
  segmented: {
    backgroundColor: color.surfaceSunken,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: space.xs,
    padding: space.xs,
  },
});
