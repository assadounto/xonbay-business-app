import React, { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { ActivityIndicator, Text } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useShops } from '@/context/ShopContext';
import { api } from '@/lib/api';
import { cachedCollection } from '@/lib/offline';
import type { Event } from '@/lib/types';
import { Card, Heading, Page, palette, PrimaryButton, StateMessage } from '@/components/ui';

export default function EventsScreen() {
  const { user } = useAuth();
  const { currentShop } = useShops();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!user || !currentShop) { setEvents([]); return; }
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
  return <Page>
    <Text onPress={() => router.back()} style={{ color: palette.blue, marginBottom: 20 }}>Back</Text>
    <Heading eyebrow="EVENTS" title="Your events" subtitle={currentShop?.name || 'Choose a shop first.'} />
    {currentShop && <PrimaryButton title="Create event" onPress={() => router.push('/create-event')} />}
    {cached && <Text style={{ color: palette.muted, marginVertical: 12 }}>Showing saved events.</Text>}
    {loading && <ActivityIndicator style={{ marginTop: 18 }} />}
    {error && <StateMessage text={error} onRetry={() => void load()} />}
    {!loading && !error && !events.length && <StateMessage text="No events found for this shop." />}
    {events.map((event) => <Card key={event.id}>
      <Text style={{ color: palette.ink, fontWeight: '800', fontSize: 16 }}>{event.title}</Text>
      <Text style={{ color: palette.muted, marginTop: 8 }}>{event.status || 'Draft'}{event.start_at ? ' · ' + new Date(event.start_at).toLocaleString() : ''}</Text>
      {!!event.venue_name && <Text style={{ color: palette.muted, marginTop: 6 }}>{event.venue_name}{event.venue_city ? ', ' + event.venue_city : ''}</Text>}
    </Card>)}
  </Page>;
}
