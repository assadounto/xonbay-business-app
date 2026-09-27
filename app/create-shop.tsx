import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, withQuery } from '@/lib/api';
import { cachedRequest } from '@/lib/offline';
import type { GhanaBusinessLocation } from '@/lib/ghana-business-locations';
import { useAuth } from '@/context/AuthContext';
import { useShops } from '@/context/ShopContext';
import { ShopLocationPicker } from '@/components/ShopLocationPicker';
import { Card, Field, FormScreen, palette, PrimaryButton } from '@/components/ui';

const STEPS = ['Name', 'Location', 'Categories', 'Logo', 'Preview'] as const;
const PROGRESS = ['20%', '40%', '60%', '80%', '100%'] as const;
type Category = { id: string | number; name: string; image_url?: string };
type Logo = { uri: string; fileName?: string | null; mimeType?: string | null; fileSize?: number };
const generatedHandle = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 30);
const cleanHandle = (value: string) => value.replace(/^@/, '').replace(/[^a-zA-Z0-9_.]/g, '').toLowerCase();

export default function CreateShop() {
  const { user } = useAuth();
  const { refresh, selectShop } = useShops();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<GhanaBusinessLocation | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState('');
  const [logo, setLogo] = useState<Logo | null>(null);
  const [availability, setAvailability] = useState<'idle' | 'checking' | 'available' | 'taken' | 'unknown'>('idle');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const chosen = useMemo(() => categories.filter((item) => selectedIds.includes(String(item.id))), [categories, selectedIds]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setCategoryLoading(true);
    cachedRequest(user.id, 0, 'shop_categories', () => api<{ data?: Category[] }>('/categories?page=1&per_page=30', {}, false))
      .then(({ value }) => { if (active) setCategories(Array.isArray(value.data) ? value.data : []); })
      .catch(() => { if (active) setCategoryError('Categories could not load. Connect and try again.'); })
      .finally(() => { if (active) setCategoryLoading(false); });
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    if (handle.length < 3) { setAvailability('idle'); return; }
    let active = true;
    setAvailability('checking');
    const timer = setTimeout(() => {
      api<{ available?: boolean; data?: { available?: boolean } }>(withQuery('/check_username', { username: handle, scope: 'shop' }))
        .then((result) => { if (active) setAvailability((result.available ?? result.data?.available) ? 'available' : 'taken'); })
        .catch(() => { if (active) setAvailability('unknown'); });
    }, 500);
    return () => { active = false; clearTimeout(timer); };
  }, [handle]);

  const changeName = (value: string) => {
    if (!handle || handle === generatedHandle(name)) setHandle(generatedHandle(value));
    setName(value);
  };
  const valid = step === 0 ? name.trim().length >= 2 && handle.length >= 3 && availability === 'available'
    : step === 1 ? Boolean(location) : step === 2 ? selectedIds.length > 0 && selectedIds.length <= 3 : true;
  const back = () => { setError(''); if (step === 0) router.back(); else setStep(step - 1); };
  const next = () => { if (!valid) return; setError(''); setStep(step + 1); };
  const chooseLogo = async () => {
    setError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85, allowsEditing: true, aspect: [1, 1] });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 8 * 1024 * 1024) { setError('Shop logo must be smaller than 8 MB.'); return; }
      setLogo(asset);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not open your photos.'); }
  };

  const launch = async () => {
    if (saving || !location || !selectedIds.length || !name.trim() || availability !== 'available') return;
    setSaving(true); setError('');
    try {
      let logoUrl = '';
      if (logo) {
        const mime = logo.mimeType || 'image/jpeg';
        const signed = await api<{ upload_url: string; public_url: string }>('/uploads/sign', { method: 'POST', body: JSON.stringify({ filename: logo.fileName || 'shop-logo.jpg', content_type: mime, folder: 'shops/logos' }) });
        if (!signed.upload_url || !signed.public_url) throw new Error('The logo upload service did not return a valid URL.');
        const blob = await (await fetch(logo.uri)).blob();
        const response = await fetch(signed.upload_url, { method: 'PUT', headers: { 'Content-Type': mime }, body: blob });
        if (!response.ok) throw new Error('Logo upload failed. Try again or remove the logo.');
        logoUrl = signed.public_url;
      }
      const form = new FormData();
      form.append('shop[name]', name.trim());
      form.append('shop[handle]', handle);
      form.append('shop[description]', description.trim());
      form.append('shop[city]', location.name);
      form.append('shop[region]', location.region);
      form.append('shop[address_line]', location.name + ', ' + location.region);
      form.append('shop[lat]', String(location.latitude));
      form.append('shop[lon]', String(location.longitude));
      selectedIds.forEach((id) => form.append('shop[category_ids][]', id));
      form.append('shop[category]', chosen.map((item) => item.name).join(', '));
      if (logoUrl) form.append('shop[logo]', logoUrl);
      const result = await api<{ id?: number; shop?: { id?: number }; data?: { id?: number } }>('/shops', { method: 'POST', body: form });
      const id = result.shop?.id || result.data?.id || result.id;
      if (!id) throw new Error('Shop was created, but the response did not include its ID. Refresh your workspaces before trying again.');
      const refreshed = await refresh();
      const created = refreshed.find((shop) => String(shop.id) === String(id));
      if (created) await selectShop(created);
      router.replace(created ? '/(business)/(tabs)' : '/workspace');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not create your shop.'); }
    finally { setSaving(false); }
  };

  return <FormScreen>
    <Pressable accessibilityRole="button" onPress={back} style={styles.back}><Ionicons name="arrow-back" color={palette.muted} size={18} /><Text style={styles.backText}>{step === 0 ? 'Back to shops' : 'Back'}</Text></Pressable>
    <Card>
      <View style={styles.heading}><Text style={styles.eyebrow}>BUSINESS SETUP</Text><Text style={styles.title}>{STEPS[step]}</Text><Text style={styles.muted}>Step {step + 1} of {STEPS.length} · Create your storefront</Text></View>
      <View style={styles.progress}><View style={[styles.progressFill, { width: PROGRESS[step] }]} /></View>

      {step === 0 && <View style={styles.content}><Text style={styles.sectionTitle}>Shop name</Text><Text style={styles.muted}>What should customers call you?</Text>
        <View style={styles.formFields}><Field label="Business name" value={name} onChangeText={changeName} placeholder="e.g. Vintage Ghana" autoCapitalize="words" />
          <Text style={styles.label}>Business description</Text><TextInput multiline value={description} onChangeText={setDescription} placeholder="Tell customers what your shop offers" placeholderTextColor={palette.placeholder} style={styles.textarea} />
          <Field label="Shop handle" value={handle} onChangeText={(value) => setHandle(cleanHandle(value))} autoCapitalize="none" placeholder="vintageghana" />
          <Text style={[styles.helper, availability === 'taken' && styles.error, availability === 'available' && styles.success]}>{availability === 'checking' ? 'Checking availability…' : availability === 'taken' ? 'This handle is already taken.' : availability === 'available' ? 'Handle is available.' : availability === 'unknown' ? 'Could not check this handle. Connect and edit it to retry.' : 'Choose a unique handle customers can remember.'}</Text>
        </View>
      </View>}
      {step === 1 && <View style={styles.content}><Text style={styles.sectionTitle}>Location</Text><Text style={styles.muted}>Where is your business based?</Text><View style={{ marginTop: 23 }}><ShopLocationPicker value={location} onSelected={setLocation} /></View>{location && <View style={styles.selectedLocation}><Ionicons name="location" size={19} color={palette.primary} /><View><Text style={styles.label}>{location.name}, {location.region}</Text><Text style={styles.helper}>{location.district} · {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</Text></View></View>}</View>}
      {step === 2 && <View style={styles.content}><View style={styles.between}><View><Text style={styles.sectionTitle}>Niche</Text><Text style={styles.muted}>Select up to 3 categories.</Text></View><Text style={styles.counter}>{selectedIds.length}/3</Text></View>
        {categoryLoading && <ActivityIndicator style={{ marginVertical: 24 }} color={palette.primary} />}
        {categoryError ? <Text style={styles.error}>{categoryError}</Text> : null}
        <View style={styles.categories}>{categories.map((item) => { const id = String(item.id); const active = selectedIds.includes(id); return <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected: active, disabled: !active && selectedIds.length >= 3 }} disabled={!active && selectedIds.length >= 3} onPress={() => setSelectedIds((old) => active ? old.filter((value) => value !== id) : [...old, id])} style={[styles.category, active && styles.categoryActive]}><View style={styles.categoryIcon}>{item.image_url ? <Image source={{ uri: item.image_url }} style={styles.categoryImage} /> : <Ionicons name="bag-outline" size={19} color={palette.muted} />}</View><Text style={[styles.label, { flex: 1 }]} numberOfLines={1}>{item.name}</Text>{active && <Ionicons name="checkmark" size={18} color={palette.primary} />}</Pressable>; })}</View>
      </View>}
      {step === 3 && <View style={[styles.content, { alignItems: 'center' }]}><Text style={styles.sectionTitle}>Upload logo</Text><Text style={styles.muted}>Add a clean logo customers will recognize.</Text><View style={styles.previewLogo}>{logo ? <Image source={{ uri: logo.uri }} style={styles.previewImage} /> : <Ionicons name="image-outline" size={44} color={palette.placeholder} />}</View><PrimaryButton title={logo ? 'Change logo' : 'Choose logo'} onPress={() => void chooseLogo()} />{logo && <Pressable onPress={() => setLogo(null)} style={styles.remove}><Text style={styles.backText}>Remove logo</Text></Pressable>}<Text style={styles.helper}>Optional · Image up to 8 MB</Text></View>}
      {step === 4 && <View style={styles.content}><Text style={styles.sectionTitle}>Preview ✨</Text><Text style={styles.muted}>Review your storefront identity before launch.</Text><View style={styles.previewCard}><View style={styles.previewRow}><View style={styles.smallLogo}>{logo ? <Image source={{ uri: logo.uri }} style={styles.smallImage} /> : <Ionicons name="storefront-outline" size={26} color={palette.primary} />}</View><View style={{ flex: 1 }}><Text style={styles.previewName} numberOfLines={1}>{name}</Text><Text style={styles.muted}>@{handle}</Text></View></View><Text style={styles.previewLabel}>LOCATION</Text><Text style={styles.label}>{location?.name}, {location?.region}</Text><Text style={styles.previewLabel}>CATEGORIES</Text><View style={styles.chosen}>{chosen.map((item) => <Text key={item.id} style={styles.chip}>{item.name}</Text>)}</View><Text style={styles.previewLabel}>ABOUT</Text><Text style={styles.muted}>{description.trim() || 'No description added yet.'}</Text></View></View>}
      {error ? <Text style={[styles.error, { marginTop: 18 }]}>{error}</Text> : null}
      <View style={styles.actions}><Pressable accessibilityRole="button" onPress={back} style={styles.outline}><Text style={styles.backText}>Back</Text></Pressable><View style={{ flex: 1 }}><PrimaryButton title={step === 4 ? 'Launch now' : 'Next step'} disabled={!valid} loading={saving} onPress={() => step === 4 ? void launch() : next()} /></View></View>
    </Card>
  </FormScreen>;
}
const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18, paddingVertical: 8, alignSelf: 'flex-start' },
  backText: { color: palette.muted, fontWeight: '800', fontSize: 13 },
  heading: { paddingBottom: 17 }, eyebrow: { color: palette.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: palette.ink, fontSize: 27, fontWeight: '900', marginTop: 5 },
  muted: { color: palette.muted, fontSize: 13, lineHeight: 20, marginTop: 5 },
  progress: { height: 6, backgroundColor: palette.background, borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: palette.primary, borderRadius: 6 },
  content: { paddingVertical: 26, minHeight: 360 },
  sectionTitle: { color: palette.ink, fontSize: 19, fontWeight: '900' },
  formFields: { marginTop: 24 }, label: { color: palette.ink, fontSize: 13, fontWeight: '800', marginBottom: 7 },
  textarea: { borderWidth: 1, borderColor: palette.border, borderRadius: 12, backgroundColor: palette.surface, padding: 14, color: palette.ink, minHeight: 94, textAlignVertical: 'top', marginBottom: 18 },
  helper: { color: palette.muted, fontSize: 11, lineHeight: 17 }, error: { color: palette.error, fontSize: 12, fontWeight: '700', lineHeight: 18 }, success: { color: palette.success },
  selectedLocation: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, backgroundColor: palette.primaryMuted, marginTop: 16 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, counter: { color: palette.muted, fontWeight: '800' },
  categories: { marginTop: 22, gap: 9 }, category: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: palette.border, borderRadius: 13, padding: 10 },
  categoryActive: { backgroundColor: palette.primaryMuted, borderColor: palette.primary }, categoryIcon: { height: 40, width: 40, borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background },
  categoryImage: { width: 40, height: 40 }, previewLogo: { width: 150, height: 150, borderRadius: 75, backgroundColor: palette.background, borderWidth: 2, borderColor: palette.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginTop: 28 },
  previewImage: { width: 150, height: 150 }, remove: { padding: 14 }, previewCard: { borderRadius: 17, padding: 19, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.background, marginTop: 20 },
  previewRow: { flexDirection: 'row', gap: 13, alignItems: 'center', marginBottom: 24 }, smallLogo: { height: 60, width: 60, borderRadius: 30, backgroundColor: palette.surface, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  smallImage: { width: 60, height: 60 }, previewName: { color: palette.ink, fontSize: 19, fontWeight: '900' }, previewLabel: { fontSize: 10, color: palette.muted, fontWeight: '900', letterSpacing: 1, marginTop: 14, marginBottom: 6 },
  chosen: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 }, chip: { fontSize: 11, color: palette.primary, fontWeight: '800', backgroundColor: palette.surface, borderRadius: 11, paddingHorizontal: 10, paddingVertical: 6 },
  actions: { borderTopWidth: 1, borderColor: palette.border, flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingTop: 16 }, outline: { borderWidth: 1, borderColor: palette.border, borderRadius: 12, paddingHorizontal: 18, minHeight: 52, justifyContent: 'center', marginTop: 16 },
});
