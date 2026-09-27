import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function Entry() {
  const { loaded, user } = useAuth();
  if (!loaded) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>;
  return <Redirect href={user ? '/workspace' : '/login'} />;
}
