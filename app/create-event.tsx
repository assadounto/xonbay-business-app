import React, { useState } from 'react';
import { router } from 'expo-router';
import { Alert, Text } from 'react-native';
import { useShops } from '@/context/ShopContext';
import { useSync } from '@/context/SyncContext';
import { Field, Heading, Page, palette, PrimaryButton } from '@/components/ui';

function parseLocal(value: string) {
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(value.replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
export default function CreateEvent() {
  const { currentShop } = useShops();
  const { queue } = useSync();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    const startAt = parseLocal(start), endAt = parseLocal(end);
    if (!currentShop || !title.trim() || !startAt || !endAt || endAt <= startAt) {
      Alert.alert('Event details', 'Add a title and valid start/end dates. End must be after start.'); return;
    }
    setSaving(true);
    try {
      await queue(currentShop.id, 'event', {
        title: title.trim(), description: description.trim(), venue_name: venue.trim(), venue_city: city.trim(),
        start_at: startAt, end_at: endAt, status: 'draft', is_free: true,
      });
      Alert.alert('Event saved', 'Your draft is saved on this device and will sync online. Add media and ticket details before publishing.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) { Alert.alert('Could not save', error instanceof Error ? error.message : 'Please try again.'); }
    finally { setSaving(false); }
  };
  return <Page>
    <Text onPress={() => router.back()} style={{ color: palette.blue, marginBottom: 20 }}>Back</Text>
    <Heading eyebrow="EVENT" title="Create an event" subtitle="Save an offline draft. Review tickets and media before publishing online." />
    <Field label="Event title" value={title} onChangeText={setTitle} />
    <Field label="Description" value={description} onChangeText={setDescription} />
    <Field label="Venue" value={venue} onChangeText={setVenue} />
    <Field label="City" value={city} onChangeText={setCity} />
    <Field label="Starts (YYYY-MM-DD HH:mm)" value={start} onChangeText={setStart} placeholder="2026-10-01 18:00" />
    <Field label="Ends (YYYY-MM-DD HH:mm)" value={end} onChangeText={setEnd} placeholder="2026-10-01 22:00" />
    <PrimaryButton title="Save event draft" loading={saving} disabled={!currentShop} onPress={() => void save()} />
  </Page>;
}
