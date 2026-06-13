import { router } from "expo-router";
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

import { api } from "../../src/api";
import { chatReducer, emptyChat } from "../../src/core/chat";
import { Screen, Text } from "../../src/ui/primitives";
import { color, radius, space, type } from "../../src/ui/tokens";

/** Session-frame affordances — vertical-specialised entry points (WP2.6). */
const FRAMES = ["Craving help", "Plan review", "Tough day", "Wins this week"] as const;

export default function Coach() {
  const [state, dispatch] = useReducer(chatReducer, undefined, emptyChat);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  // Crisis gate fired → scripted crisis flow, full-screen, nothing else.
  useEffect(() => {
    if (state.crisisActive) {
      dispatch({ type: "crisis_dismissed" });
      router.push("/crisis");
    }
  }, [state.crisisActive]);

  // A pending request exists only for gate-cleared text; stream the reply.
  useEffect(() => {
    if (!state.pendingCoachRequest) return;
    void api.streamCoachReply(state.pendingCoachRequest, (token) =>
      dispatch({ type: "stream_token", token }),
    ).then(() => dispatch({ type: "stream_end" }));
  }, [state.pendingCoachRequest]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setDraft("");
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
          Preview — the live coach arrives with a later update. In a crisis, this chat steps aside.
        </Text>
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
                <Pressable key={f} style={styles.frameChip} onPress={() => send(f)}>
                  <Text variant="caption" color={color.primary}>
                    {f}
                  </Text>
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
  frameChip: {
    backgroundColor: color.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
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
  sendButton: {
    alignSelf: "flex-end",
    backgroundColor: color.primary,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 12,
  },
  userBubble: { alignSelf: "flex-end", backgroundColor: color.primary },
});
