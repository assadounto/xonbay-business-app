import React, { useState } from 'react';
import { router } from 'expo-router';
import { Alert, Text } from 'react-native';
import { useShops } from '@/context/ShopContext';
import { useSync } from '@/context/SyncContext';
import { Field, Heading, Page, palette, PrimaryButton } from '@/components/ui';

export default function CreateProduct() {
  const { currentShop } = useShops();
  const { queue } = useSync();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!currentShop || !name.trim() || !/^\d+(\.\d{1,2})?$/.test(price) || !/^\d+$/.test(quantity)) {
      Alert.alert('Product details', 'Enter a name, a valid GHS price and a whole number for stock.'); return;
    }
    setSaving(true);
    try {
      await queue(currentShop.id, 'product', {
        name: name.trim(), description: description.trim(), price: Number(price), quantity: Number(quantity),
        commission_rate: 0, kind: 'simple', track_inventory: true, active: false,
      });
      Alert.alert('Product saved', 'This product is saved on your phone and will sync as an inactive listing. Add photos and activate it after reviewing it online.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) { Alert.alert('Could not save', error instanceof Error ? error.message : 'Please try again.'); }
    finally { setSaving(false); }
  };
  return <Page>
    <Text onPress={() => router.back()} style={{ color: palette.blue, marginBottom: 20 }}>Back</Text>
    <Heading eyebrow="PRODUCT" title="Add a product" subtitle="Saved on your phone first. It syncs to your shop as an inactive listing; add images and activate it after review." />
    <Field label="Name" value={name} onChangeText={setName} />
    <Field label="Description" value={description} onChangeText={setDescription} />
    <Field label="Price (GHS)" value={price} onChangeText={setPrice} keyboardType="default" placeholder="25.00" />
    <Field label="Starting stock" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
    <PrimaryButton title="Save product" loading={saving} disabled={!currentShop} onPress={() => void save()} />
  </Page>;
}
