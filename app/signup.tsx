import React, { useState } from 'react';
import { Alert, Pressable, Text } from 'react-native';
import { router } from 'expo-router';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { BrandHeader, Card, Field, FormScreen, Heading, palette, PrimaryButton } from '@/components/ui';

type Step = 'email' | 'code' | 'account';
export default function SignUp() {
  const { signUp } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const next = async () => {
    setLoading(true);
    try {
      if (step === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error('Enter a valid email address.');
        await api('/auth/send_code', { method: 'POST', body: JSON.stringify({ email: email.trim() }) }, false);
        setStep('code');
      } else if (step === 'code') {
        if (!code.trim()) throw new Error('Enter the verification code.');
        await api('/auth/verify_code', { method: 'POST', body: JSON.stringify({ email: email.trim(), code: code.trim() }) }, false);
        setStep('account');
      } else {
        if (!name.trim() || username.trim().length < 3 || password.length < 8) throw new Error('Add your name, a username of at least 3 characters and a password of at least 8 characters.');
        await signUp({ email, name, username, password });
        router.replace('/workspace');
      }
    } catch (error) {
      Alert.alert('Could not continue', error instanceof Error ? error.message : 'Please try again.');
    } finally { setLoading(false); }
  };
  return (
    <FormScreen centered>
        <BrandHeader />
        <Heading title={step === 'email' ? 'Start with your email' : step === 'code' ? 'Verify your email' : 'Set up your account'} subtitle={step === 'code' ? 'Enter the code sent to ' + email : 'Your account can manage one or more Xonbay shops.'} />
        <Card>
        {step === 'email' && <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />}
        {step === 'code' && <Field label="Verification code" value={code} onChangeText={setCode} keyboardType="number-pad" />}
        {step === 'account' && <>
          <Field label="Full name" value={name} onChangeText={setName} autoCapitalize="words" />
          <Field label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        </>}
        <PrimaryButton title={step === 'account' ? 'Create account' : 'Continue'} onPress={() => void next()} loading={loading} />
        </Card>
        <Pressable style={{ alignItems: 'center', marginTop: 22 }} onPress={() => step === 'email' ? router.replace('/login') : setStep(step === 'account' ? 'code' : 'email')}>
          <Text style={{ color: palette.primary, fontWeight: '700' }}>{step === 'email' ? 'Already have an account? Sign in' : 'Back'}</Text>
        </Pressable>
    </FormScreen>
  );
}
