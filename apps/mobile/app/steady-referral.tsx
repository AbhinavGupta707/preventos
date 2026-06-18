import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { Button, Card, ProgrammeChip, Screen, Text } from "../src/ui/primitives";
import { color, space } from "../src/ui/tokens";

export default function SteadyReferral() {
  return (
    <Screen testID="steady-referral-screen">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <ProgrammeChip label="Steady referral-only" tone="muted" />
        <View style={{ height: space.sm }} />
        <Text variant="title">Steady is not open for self-guided cutting down yet</Text>
        <View style={{ height: space.xs }} />
        <Text variant="body" color={color.inkMuted}>
          Alcohol support has a stricter safety boundary than the smoking and vaping beta. If your body may be
          dependent on alcohol, an app should not offer unit goals, drink-free-day plans, or coaching on its own.
        </Text>

        <View style={{ height: space.md }} />
        <Card tone="peach" testID="steady-hardstop-copy">
          <Text variant="heading">When to get proper support first</Text>
          <View style={{ height: space.xs }} />
          <Text variant="body" color={color.inkMuted}>
            If stopping or cutting down brings shakes, sweats, confusion, seizures, or a need to drink first thing in
            the morning, please speak to your GP or call Drinkline on 0300 123 1110. That needs support from people who
            do this professionally.
          </Text>
        </Card>

        <View style={{ height: space.md }} />
        <Card tone="soft">
          <Text variant="heading">What the app will do right now</Text>
          <View style={{ height: space.xs }} />
          <Text variant="body" color={color.inkMuted}>
            Keep this as a referral-only route. No drink log, no reduction plan, and no coach path are unlocked from
            this screen. This is a boundary, not a judgement.
          </Text>
        </Card>

        <View style={{ height: space.lg }} />
        <Button testID="steady-back" label="Back to programmes" onPress={() => router.replace("/onboarding/programme")} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: space.xxl, paddingTop: space.lg },
});
