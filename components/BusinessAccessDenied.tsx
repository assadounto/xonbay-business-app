import React from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { Card, Page, palette, PrimaryButton } from './ui';

export function BusinessAccessDenied() {
  return <Page><Card><View style={{ alignItems: 'center', paddingVertical: 24 }}>
    <Ionicons name="lock-closed-outline" color={palette.muted} size={32} />
    <Text style={{ color: palette.ink, fontSize: 18, fontWeight: '900', marginTop: 14 }}>Access is restricted</Text>
    <Text style={{ color: palette.muted, textAlign: 'center', lineHeight: 20, marginTop: 8, marginBottom: 18 }}>The shop owner controls this permission for members.</Text>
    <PrimaryButton title="Return to overview" onPress={() => router.replace('/(business)/(tabs)')} />
  </View></Card></Page>;
}
