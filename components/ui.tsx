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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useSync } from "@/context/SyncContext";

export const palette = {
  background: "#F5F6FA",
  ink: "#1D2130",
  muted: "#626B80",
  blue: "#5865F2",
  border: "#E4E7F0",
  white: "#FFFFFF",
};
export function Page({ children }: { children: React.ReactNode }) {
  const { online, pending, attention } = useSync();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const hasTabBar = segments[0] === "(tabs)";
  return (
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
      automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
    >
      {(!online || pending > 0 || attention > 0) && (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/sync-queue")}
          style={{
            padding: 12,
            borderRadius: 10,
            backgroundColor: attention ? "#FEF3C7" : "#DBEAFE",
            marginBottom: 18,
          }}
        >
          <Text style={{ color: palette.ink, fontWeight: "700" }}>
            {online ? "Online" : "Offline"} · {pending} waiting to sync
            {attention ? " · " + attention + " need review" : ""}
          </Text>
        </Pressable>
      )}
      {children}
    </ScrollView>
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
        <ActivityIndicator color="#fff" />
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
        placeholderTextColor="#94A3B8"
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
  formContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
  formCentered: { justifyContent: "center" },
  heading: { marginBottom: 20 },
  eyebrow: {
    color: palette.blue,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: { color: palette.ink, fontSize: 27, fontWeight: "800" },
  subtitle: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  card: {
    backgroundColor: palette.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 18,
    marginBottom: 14,
  },
  button: {
    backgroundColor: palette.blue,
    borderRadius: 14,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  disabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
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
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 50,
    fontSize: 15,
    color: palette.ink,
  },
  link: { color: palette.blue, fontWeight: "700", marginTop: 12 },
});
