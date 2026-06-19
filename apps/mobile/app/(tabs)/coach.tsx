import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useReducer, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import type { CoachFrame } from "@preventos/api-client";
import type { Vertical } from "@preventos/domain";

import { api } from "../../src/api";
import type { CoachReplyRequest } from "../../src/api/port";
import { chatReducer, emptyChat } from "../../src/core/chat";
import { daysWonFor, todayIso, useAppStore } from "../../src/state/store";
import { Companion } from "../../src/ui/Companion";
import { ProgrammeChip, Screen, Text } from "../../src/ui/primitives";
import { color, radius, space, type } from "../../src/ui/tokens";

/** Session-frame affordances — vertical-specialised entry points (WP2.6). */
const FRAMES: readonly { readonly label: string; readonly frame: CoachFrame }[] = [
  { label: "Craving help", frame: "craving_rescue" },
  { label: "Plan review", frame: "general" },
  { label: "Tough day", frame: "general" },
  { label: "Wins this week", frame: "general" },
] as const;

const lastLapseVertical = (
  enrolments: readonly { readonly vertical: Vertical }[],
  lapses: Readonly<Partial<Record<Vertical, readonly string[]>>>,
): Vertical | undefined => enrolments.find((enrolment) => (lapses[enrolment.vertical]?.length ?? 0) > 0)?.vertical;

export default function Coach() {
  const [state, dispatch] = useReducer(chatReducer, undefined, emptyChat);
  const [draft, setDraft] = useState("");
  const [pendingCoachMeta, setPendingCoachMeta] = useState<CoachReplyRequest | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const enrolments = useAppStore((s) => s.enrolments);
  const lapses = useAppStore((s) => s.lapses);
  const today = todayIso();
  const companionDaysWon = enrolments.reduce(
    (max, e) => Math.max(max, daysWonFor(e, lapses[e.vertical] ?? [], today)),
    0,
  );

  // Crisis gate fired → scripted crisis flow, full-screen, nothing else.
  useEffect(() => {
    if (state.crisisActive) {
      setPendingCoachMeta(null);
      dispatch({ type: "crisis_dismissed" });
      router.push("/crisis");
    }
  }, [state.crisisActive]);

  // A pending request exists only for gate-cleared text; stream the reply.
  useEffect(() => {
    if (!state.pendingCoachRequest) return;
    const request =
      pendingCoachMeta ??
      ({
        vertical: enrolments[0]?.vertical ?? "smoking",
        frame: "general",
      } satisfies CoachReplyRequest);
    let cancelled = false;
    void api
      .streamCoachReply(
        state.pendingCoachRequest,
        (token) => {
          if (!cancelled) dispatch({ type: "stream_token", token });
        },
        request,
      )
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          dispatch({
            type: "stream_token",
            token: "Coach is unavailable right now. Rescue tools still work offline.",
          });
        }
        dispatch({ type: "stream_end" });
        setPendingCoachMeta(null);
      });
    return () => {
      cancelled = true;
    };
  }, [state.pendingCoachRequest]);

  const makeCoachRequest = (frame: CoachFrame): CoachReplyRequest => {
    const lapseVertical = lastLapseVertical(enrolments, lapses);
    return {
      vertical: enrolments[0]?.vertical ?? "smoking",
      frame,
      context: {
        daysWon: companionDaysWon,
        streakActive: companionDaysWon > 0,
        enrolledVerticals: enrolments.map((enrolment) => enrolment.vertical),
        ...(lapseVertical !== undefined ? { lastLapseVertical: lapseVertical } : {}),
      },
    };
  };

  const send = (text: string, frame: CoachFrame = "general") => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setDraft("");
    setPendingCoachMeta(makeCoachRequest(frame));
    dispatch({ type: "send", text: trimmed });
  };

  return (
    <Screen testID="coach-screen">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={8}
      >
        <Text variant="display">Coach</Text>
        <Text variant="caption" color={color.inkFaint}>
          Warm support for QuitKit and Exhale. If a message sounds urgent, this chat steps aside.
        </Text>
        <Companion context="coach" daysWon={companionDaysWon} hour={new Date().getHours()} />
        <View style={{ height: space.sm }} />

        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {state.messages.length === 0 ? (
            <View style={styles.frames}>
              {FRAMES.map((f) => (
                <Pressable
                  key={f.label}
                  accessibilityRole="button"
                  accessibilityLabel={`Start coach frame: ${f.label}`}
                  style={({ pressed }) => [styles.frameChip, pressed ? styles.pressed : null]}
                  onPress={() => send(f.label, f.frame)}
                >
                  <ProgrammeChip label={f.label} tone={f.label === "Wins this week" ? "success" : "peach"} />
                </Pressable>
              ))}
            </View>
          ) : null}
          {state.messages.map((m) => (
            <View
              key={m.id}
              style={[styles.bubble, m.role === "user" ? styles.userBubble : styles.coachBubble]}
            >
              <Text variant="body" color={m.role === "user" ? color.onPrimary : color.ink}>
                {m.text + (m.streaming ? " …" : "")}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            testID="coach-input"
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Say what's actually going on…"
            placeholderTextColor={color.inkFaint}
            multiline
          />
          <Pressable testID="coach-send" style={styles.sendButton} onPress={() => send(draft)}>
            <Ionicons name="arrow-up" size={16} color={color.onPrimary} />
            <Text variant="bodyStrong" color={color.onPrimary}>
              Send
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderRadius: radius.md,
    marginBottom: space.sm,
    maxWidth: "85%",
    padding: space.sm + 4,
  },
  coachBubble: { alignSelf: "flex-start", backgroundColor: color.surface },
  flex: { flex: 1 },
  frameChip: { borderRadius: radius.pill },
  frames: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, paddingVertical: space.md },
  input: {
    ...type.body,
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: color.ink,
    flex: 1,
    maxHeight: 120,
    paddingHorizontal: space.sm + 4,
    paddingVertical: space.sm,
  },
  // marginBottom clears the floating rescue button so Send stays tappable
  inputRow: { flexDirection: "row", gap: space.sm, marginBottom: 64, paddingTop: space.sm },
  messages: { paddingBottom: space.md },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  sendButton: {
    alignItems: "center",
    alignSelf: "flex-end",
    flexDirection: "row",
    gap: 6,
    backgroundColor: color.primary,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 12,
  },
  userBubble: { alignSelf: "flex-end", backgroundColor: color.primary },
});
