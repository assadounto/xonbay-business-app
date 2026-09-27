import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Field, Heading, palette, PrimaryButton, styles } from '@/components/ui';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    try { await signIn(email, password); router.replace('/(tabs)'); }
    catch (error) { Alert.alert('Sign in failed', error instanceof Error ? error.message : 'Please try again.'); }
    finally { setLoading(false); }
  };
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.pageContent, { flexGrow: 1, justifyContent: 'center' }]}>
        <Text style={{ fontWeight: '900', fontSize: 17, color: palette.blue, marginBottom: 36 }}>XONBAY BUSINESS</Text>
        <Heading eyebrow="MERCHANT ACCESS" title="Welcome back" subtitle="Sign in to manage your shops, orders and inventory." />
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Your password" />
        <PrimaryButton title="Sign in" loading={loading} disabled={!email.trim() || !password} onPress={() => void submit()} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 28 }}>
          <Text style={{ color: palette.muted }}>New to Xonbay? </Text>
          <Pressable onPress={() => router.push('/signup')}><Text style={{ color: palette.blue, fontWeight: '700' }}>Create account</Text></Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
