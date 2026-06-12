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
  readonly kind?: "primary" | "secondary" | "rescue" | "crisis" | "ghost";
  readonly disabled?: boolean;
  readonly testID?: string;
}

const buttonStyles: Record<NonNullable<ButtonProps["kind"]>, { bg: string; fg: string; border?: string }> = {
  primary: { bg: color.primary, fg: color.onPrimary },
  secondary: { bg: color.primarySoft, fg: color.primary },
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
        { backgroundColor: s.bg, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        s.border ? { borderWidth: 1, borderColor: s.border } : null,
      ]}
    >
      <RNText style={[type.bodyStrong as TextStyle, { color: s.fg }]}>{label}</RNText>
    </Pressable>
  );
}

interface CardProps {
  readonly children: ReactNode;
  readonly tone?: "surface" | "soft" | "accent" | "rescue";
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

const cardTones = {
  surface: color.surface,
  soft: color.primarySoft,
  accent: color.accentSoft,
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
  readonly testID?: string;
}

/** Tap-to-answer row used for instrument items and intake questions. */
export function OptionRow({ label, selected, onPress, testID }: OptionRowProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.optionRow, selected ? styles.optionRowSelected : null]}
    >
      <RNText style={[type.body as TextStyle, { color: selected ? color.primary : color.ink }]}>{label}</RNText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  optionRow: {
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: radius.md,
    borderWidth: 1.5,
    marginBottom: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: 14,
  },
  optionRowSelected: {
    backgroundColor: color.primarySoft,
    borderColor: color.primary,
  },
  screen: {
    flex: 1,
    paddingHorizontal: space.md,
  },
});
