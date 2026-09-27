import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useSync } from "@/context/SyncContext";
import { palette } from "@/theme/colors";

export { palette } from "@/theme/colors";
export function Page({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  const { online, pending, attention } = useSync();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const hasTabBar = segments[0] === "(tabs)";
  const Container = footer ? KeyboardAvoidingView : View;
  return (
    <Container style={styles.page} behavior={footer && Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView
      style={styles.page}
      contentContainerStyle={[
        styles.pageContent,
        {
          paddingTop: insets.top + 20,
          paddingBottom: hasTabBar ? 32 : insets.bottom + 32,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={Platform.OS === "ios" && !footer}
    >
      {(!online || pending > 0 || attention > 0) && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View sync status"
          onPress={() => router.push("/sync-queue")}
          style={[styles.syncBanner, { backgroundColor: attention ? palette.warningSoft : palette.primaryMuted }]}
        >
          <Ionicons name={attention ? "alert-circle-outline" : online ? "cloud-upload-outline" : "cloud-offline-outline"} size={20} color={attention ? palette.warning : palette.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.syncTitle}>{attention ? "Needs your attention" : online ? "Syncing your changes" : "Working offline"}</Text>
            <Text style={styles.syncSubtitle}>{pending} waiting to sync{attention ? " · " + attention + " to review" : ""}</Text>
          </View>
          <Ionicons name="chevron-forward" size={17} color={palette.muted} />
        </Pressable>
      )}
      {children}
    </ScrollView>
    {footer && <View style={styles.stickyFooter}>{footer}</View>}
    </Container>
  );
}
export function FormScreen({
  children,
  centered = false,
}: {
  children: React.ReactNode;
  centered?: boolean;
}) {
  return (
    <SafeAreaView style={styles.page} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[styles.formContent, centered && styles.formCentered]}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Heading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.heading}>
      {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}
export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}
export function SectionTitle({ title, caption, action, onPress }: { title: string; caption?: string; action?: string; onPress?: () => void }) {
  return <View style={styles.sectionRow}>
    <View style={{ flex: 1 }}><Text style={styles.sectionTitle}>{title}</Text>{caption && <Text style={styles.sectionCaption}>{caption}</Text>}</View>
    {action && onPress && <Pressable accessibilityRole="button" onPress={onPress} style={styles.sectionAction}><Text style={{ color: palette.primary, fontWeight: "800" }}>{action}</Text><Ionicons name="chevron-forward" size={15} color={palette.primary} /></Pressable>}
  </View>;
}
export function BackButton() {
  return <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
    <Ionicons name="arrow-back" size={19} color={palette.ink} /><Text style={{ color: palette.ink, fontWeight: "800" }}>Back</Text>
  </Pressable>;
}
export function BrandHeader() {
  return <View style={styles.brandRow}><View style={styles.brandMark}><Text style={styles.brandX}>X</Text></View><View><Text style={styles.brandName}>Xonbay</Text><Text style={styles.brandCaption}>BUSINESS WORKSPACE</Text></View></View>;
}
export function StatusPill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "good" | "warning" }) {
  const color = tone === "good" ? palette.success : tone === "warning" ? palette.warning : palette.primary;
  const backgroundColor = tone === "good" ? palette.successSoft : tone === "warning" ? palette.warningSoft : palette.primaryMuted;
  return <View style={[styles.pill, { backgroundColor }]}><Text style={{ color, fontSize: 11, fontWeight: "800" }} numberOfLines={1}>{label}</Text></View>;
}
export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={loading || disabled}
      style={[styles.button, (loading || disabled) && styles.disabled]}
    >
      {loading ? (
        <ActivityIndicator color={palette.white} />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "email-address" | "number-pad" | "default";
  autoCapitalize?: "none" | "sentences" | "words";
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={palette.placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
    </View>
  );
}
export function StateMessage({
  text,
  onRetry,
}: {
  text: string;
  onRetry?: () => void;
}) {
  return (
    <Card>
      <Text style={styles.subtitle}>{text}</Text>
      {onRetry && (
        <Pressable onPress={onRetry}>
          <Text style={styles.link}>Try again</Text>
        </Pressable>
      )}
    </Card>
  );
}
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.background },
  pageContent: { paddingHorizontal: 20 },
  stickyFooter: { backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
  formContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
  formCentered: { justifyContent: "center" },
  heading: { marginBottom: 20 },
  syncBanner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: palette.border, marginBottom: 18 },
  syncTitle: { color: palette.ink, fontWeight: "800", fontSize: 13 },
  syncSubtitle: { color: palette.muted, fontSize: 12, marginTop: 2 },
  eyebrow: {
    color: palette.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: { color: palette.ink, fontSize: 29, fontWeight: "900", letterSpacing: -0.6 },
  subtitle: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 18,
    marginBottom: 14,
  },
  sectionRow: { flexDirection: "row", alignItems: "center", marginTop: 14, marginBottom: 12, gap: 10 },
  sectionTitle: { color: palette.ink, fontWeight: "900", fontSize: 19, letterSpacing: -0.3 },
  sectionCaption: { color: palette.muted, fontSize: 12, marginTop: 3 },
  sectionAction: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  backButton: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 9, marginBottom: 18 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 34 },
  brandMark: { width: 44, height: 44, borderRadius: 14, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" },
  brandX: { color: palette.white, fontWeight: "900", fontSize: 25 },
  brandName: { color: palette.ink, fontWeight: "900", fontSize: 19, lineHeight: 22 },
  brandCaption: { color: palette.muted, fontWeight: "800", fontSize: 10, letterSpacing: 1 },
  pill: { alignSelf: "flex-start", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  button: {
    backgroundColor: palette.primary,
    borderRadius: 14,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  disabled: { opacity: 0.5 },
  buttonText: { color: palette.white, fontWeight: "700", fontSize: 15 },
  field: { marginBottom: 15 },
  label: {
    color: palette.ink,
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 7,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 50,
    fontSize: 15,
    color: palette.ink,
  },
  link: { color: palette.primary, fontWeight: "700", marginTop: 12 },
});
