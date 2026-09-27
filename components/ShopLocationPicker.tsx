import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GHANA_BUSINESS_LOCATIONS, type GhanaBusinessLocation } from '@/lib/ghana-business-locations';
import { palette, PrimaryButton } from './ui';

const RADIUS_METERS = 5000;
function distance(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const rad = (value: number) => value * Math.PI / 180;
  const lat = rad(b.latitude - a.latitude);
  const lon = rad(b.longitude - a.longitude);
  const h = Math.sin(lat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(lon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function ShopLocationPicker({ value, onSelected }: { value: GhanaBusinessLocation | null; onSelected: (location: GhanaBusinessLocation) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<GhanaBusinessLocation | null>(value);
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const results = useMemo(() => GHANA_BUSINESS_LOCATIONS.filter((item) =>
    [item.name, item.region, item.district].some((field) => field.toLowerCase().includes(query.trim().toLowerCase()))
  ).slice(0, query.trim() ? 30 : 16), [query]);

  const locate = async () => {
    setLocating(true); setError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') throw new Error('Location permission is needed to confirm a shop area. Enable it in device settings and try again.');
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High, mayShowUserSettingsDialog: true });
      const coordinates = { latitude: current.coords.latitude, longitude: current.coords.longitude };
      setPosition(coordinates);
      if (!selected) setSelected(GHANA_BUSINESS_LOCATIONS.reduce((best, item) => distance(coordinates, item) < distance(coordinates, best) ? item : best));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not find your location.'); }
    finally { setLocating(false); }
  };
  const confirm = () => {
    if (!selected || !position) { setError('Select an area and allow GPS location before continuing.'); return; }
    if (distance(position, selected) > RADIUS_METERS) { setError('You must be physically within 5 km of this area to use it as your shop location.'); return; }
    onSelected(selected); setOpen(false); setError('');
  };
  return <>
    <Pressable accessibilityRole="button" onPress={() => { setSelected(value); setOpen(true); void locate(); }} style={styles.entry}>
      <View style={styles.icon}><Ionicons name="location-outline" color={palette.primary} size={21} /></View>
      <View style={{ flex: 1 }}><Text style={styles.name}>{value ? value.name + ', ' + value.region : 'Choose location'}</Text><Text style={styles.detail}>{value ? value.district + ' · Tap to change' : 'Select the exact business area'}</Text></View>
      <Ionicons name="chevron-forward" size={18} color={palette.muted} />
    </Pressable>
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
      <SafeAreaView style={styles.sheet} edges={['top', 'bottom']}>
        <View style={styles.header}><View style={{ flex: 1 }}><Text style={styles.eyebrow}>BUSINESS LOCATION</Text><Text style={styles.title}>Choose location</Text><Text style={styles.detail}>Confirm the area near your device.</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close location picker" onPress={() => setOpen(false)} style={styles.close}><Ionicons name="close" size={22} color={palette.ink} /></Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 24 }}>
          <Pressable accessibilityRole="button" onPress={() => void locate()} style={styles.gps}>
            <Ionicons name="navigate-outline" size={24} color={palette.primary} /><View style={{ flex: 1 }}><Text style={styles.name}>{locating ? 'Finding your location…' : position ? 'Device location confirmed' : 'Use my current area'}</Text><Text style={styles.detail}>GPS is required to verify your shop area.</Text></View>{locating && <ActivityIndicator color={palette.primary} />}
          </Pressable>
          <Text style={[styles.name, { marginTop: 22, marginBottom: 9 }]}>Search locations</Text>
          <TextInput style={styles.input} placeholder="Search area, district or region" placeholderTextColor={palette.placeholder} value={query} onChangeText={setQuery} />
          {results.map((item) => { const active = selected?.name === item.name && selected.region === item.region; return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => { setSelected(item); setError(''); }} key={item.name + item.region} style={[styles.row, active && styles.active]}>
            <Ionicons name="location-outline" size={18} color={active ? palette.primary : palette.muted} /><View style={{ flex: 1 }}><Text style={styles.name}>{item.name}</Text><Text style={styles.detail}>{item.district} · {item.region}</Text></View>{active && <Ionicons name="checkmark" size={19} color={palette.primary} />}
          </Pressable>; })}
          {!results.length && <Text style={styles.detail}>No matching location found.</Text>}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
        <View style={styles.footer}><PrimaryButton title="Use this location" disabled={!selected || locating} onPress={confirm} /></View>
      </SafeAreaView>
    </Modal>
  </>;
}
const styles = StyleSheet.create({
  entry: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderColor: palette.border, borderWidth: 1, backgroundColor: palette.surface, borderRadius: 14 },
  icon: { width: 40, height: 40, borderRadius: 11, backgroundColor: palette.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  sheet: { flex: 1, backgroundColor: palette.surface },
  header: { flexDirection: 'row', gap: 12, alignItems: 'center', borderBottomWidth: 1, borderColor: palette.border, padding: 20 },
  eyebrow: { fontSize: 10, color: palette.primary, fontWeight: '900', letterSpacing: 1.3 },
  title: { fontSize: 22, fontWeight: '900', color: palette.ink, marginTop: 4 },
  name: { color: palette.ink, fontWeight: '800', fontSize: 14 },
  detail: { color: palette.muted, fontSize: 12, marginTop: 4, lineHeight: 18 },
  close: { height: 38, width: 38, borderRadius: 19, backgroundColor: palette.background, justifyContent: 'center', alignItems: 'center' },
  gps: { backgroundColor: palette.primaryMuted, borderRadius: 14, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' },
  input: { borderColor: palette.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, minHeight: 48, color: palette.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderColor: palette.border, paddingVertical: 13 },
  active: { backgroundColor: palette.primaryMuted },
  error: { color: palette.error, marginTop: 18, lineHeight: 20, fontWeight: '700' },
  footer: { borderTopWidth: 1, borderColor: palette.border, paddingHorizontal: 20, paddingBottom: 12 },
});
