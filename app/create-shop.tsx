import React, { useState } from 'react';
import { Alert, Pressable, Text } from 'react-native';
import { router } from 'expo-router';
import { api } from '@/lib/api';
import { useShops } from '@/context/ShopContext';
import { Field, FormScreen, Heading, PrimaryButton, styles } from '@/components/ui';

export default function CreateShop() {
  const { refresh } = useShops();
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!name.trim() || handle.trim().length < 3 || !city.trim()) {
      Alert.alert('Shop details', 'Add a shop name, handle and city.');
      return;
    }
    setSaving(true);
    try {
      await api('/shops', { method: 'POST', body: JSON.stringify({
        shop: { name: name.trim(), handle: handle.trim().toLowerCase().replace(/^@/, ''), city: city.trim(), region: region.trim(), category: category.trim(), address_line: [city.trim(), region.trim()].filter(Boolean).join(', ') },
      }) });
      await refresh();
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Could not create shop', error instanceof Error ? error.message : 'Please try again.');
    } finally { setSaving(false); }
  };
  return (
    <FormScreen>
        <Pressable onPress={() => router.back()}><Text style={[styles.link, { marginBottom: 25 }]}>Back</Text></Pressable>
        <Heading eyebrow="NEW SHOP" title="Set up your shop" subtitle="Start with the basics. You can add products and details after creating it." />
        <Field label="Shop name" value={name} onChangeText={setName} placeholder="Your business name" />
        <Field label="Shop handle" value={handle} onChangeText={setHandle} autoCapitalize="none" placeholder="myshop" />
        <Field label="City" value={city} onChangeText={setCity} />
        <Field label="Region" value={region} onChangeText={setRegion} />
        <Field label="Category" value={category} onChangeText={setCategory} placeholder="What do you sell?" />
        <PrimaryButton title="Create shop" loading={saving} onPress={() => void create()} />
    </FormScreen>
  );
}
