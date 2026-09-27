import React, { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useShops } from '@/context/ShopContext';
import { api } from '@/lib/api';
import { cachedCollection } from '@/lib/offline';
import type { Event } from '@/lib/types';
import { canAccess } from '@/lib/business-navigation';
import { BusinessAccessDenied } from '@/components/BusinessAccessDenied';
import { BackButton, Card, Heading, Page, palette, PrimaryButton, SectionTitle, StateMessage, StatusPill } from '@/components/ui';

export default function EventsScreen() {
  const { user } = useAuth();
  const { currentShop } = useShops();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!user || !currentShop || !canAccess(currentShop, 'events_tickets')) { setEvents([]); return; }
    setLoading(true); setError(''); setEvents([]);
    try {
      const result = await cachedCollection<Event>(user.id, currentShop.id, 'events',
        (page) => '/events?shop_id=' + currentShop.id + '&page=' + page + '&per_page=100',
        (response) => response.data || []);
      setEvents(result.value); setCached(result.offline);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load events'); }
    finally { setLoading(false); }
  }, [currentShop?.id, user?.id]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  if (currentShop && !canAccess(currentShop, 'events_tickets')) return <BusinessAccessDenied />;
  return <Page>
    <BackButton />
    <Heading eyebrow="YOUR WORKSPACE / EVENTS" title="Events" subtitle={currentShop ? 'Plan and manage events for ' + currentShop.name : 'Choose a shop first.'} />
    {currentShop && <PrimaryButton title="Create event" onPress={() => router.push('/create-event')} />}
    {cached && <View style={{ marginTop: 12 }}><StatusPill label="Saved events · reconnect for updates" tone="warning" /></View>}
    <SectionTitle title="Your events" caption={events.length + ' events'} action="Refresh" onPress={() => void load()} />
    {loading && <ActivityIndicator style={{ marginTop: 18 }} />}
    {error && <StateMessage text={error} onRetry={() => void load()} />}
    {!loading && !error && !events.length && <StateMessage text="No events found for this shop." />}
    {events.map((event) => <Card key={event.id}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}><View style={{ flex: 1 }}><Text style={{ color: palette.ink, fontWeight: '900', fontSize: 16 }}>{event.title}</Text></View><StatusPill label={event.status || 'Draft'} tone={event.status === 'published' ? 'good' : 'warning'} /></View>
      {event.start_at && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 13 }}><Ionicons name="time-outline" color={palette.muted} size={17} /><Text style={{ color: palette.muted }}>{new Date(event.start_at).toLocaleString()}</Text></View>}
      {!!event.venue_name && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 8 }}><Ionicons name="location-outline" color={palette.muted} size={17} /><Text style={{ color: palette.muted, flex: 1 }}>{event.venue_name}{event.venue_city ? ', ' + event.venue_city : ''}</Text></View>}
    </Card>)}
  </Page>;
}
