import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TrendingDown, Search } from 'lucide-react-native';
import { groupsApi } from '@/api/rides';
import StatusTag from '@/components/StatusTag';
import { formatTime, shortDate } from '@/lib/format';

function Avatar({ initials, booker }) {
  return (
    <View className={`w-8 h-8 rounded-full items-center justify-center ${booker ? 'bg-primary' : 'bg-primary-light'}`}>
      <Text className={`text-[11px] font-bold ${booker ? 'text-white' : 'text-primary-dark'}`}>{initials}</Text>
    </View>
  );
}

function Row({ label, value, valueClass = 'text-text' }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-[13px] text-text-3">{label}</Text>
      <Text className={`text-[13px] font-semibold ${valueClass}`}>{value}</Text>
    </View>
  );
}

function GroupCard({ g, rideId }) {
  const router = useRouter();
  const isFull = g.status === 'full';
  const flights = (g.members || [])
    .map((m) => m.flightTime)
    .filter(Boolean);
  // members carry flightTime only in full serializer; browse serializer includes it.
  const flightText = g.flightWindowStart
    ? `${formatTime(g.flightWindowStart)}${g.flightWindowEnd && g.flightWindowEnd !== g.flightWindowStart ? ` – ${formatTime(g.flightWindowEnd)}` : ''}`
    : '—';

  return (
    <Pressable
      testID={`browse-card-${g.id}`}
      disabled={isFull}
      onPress={() => router.push({ pathname: '/group', params: { id: g.id, ...(rideId ? { rideId } : {}) } })}
      className="mx-5 mb-3 rounded-[14px] bg-white p-4 border border-border"
      style={{ opacity: isFull ? 0.5 : 1 }}
    >
      <View className="flex-row items-center justify-between mb-2.5">
        <Text className="text-[15px] font-bold text-text">
          {g.direction === 'airport_to_university' ? 'Airport → Campus' : 'Campus → Airport'}
        </Text>
        <StatusTag status={g.status} memberCount={g.memberCount} capacity={g.capacity} />
      </View>

      {g.members && g.members.length ? (
        <View className="flex-row items-center mb-2.5" style={{ gap: 6 }}>
          {g.members.slice(0, 4).map((m, i) => (
            <View key={i} className="flex-row items-center" style={{ gap: 4 }}>
              <Avatar initials={m.initials} booker={m.isBooker} />
            </View>
          ))}
        </View>
      ) : null}

      <Row label="Flights" value={flightText} />
      {!isFull ? (
        <>
          <Row label="Depart" value={`~${formatTime(g.suggestedDeparture)}`} />
          <Row label="Vehicle" value={`${g.vehicleSuggestion || 'UberX'} · ${g.totalBags || 0} bags`} />
          <Row label="Est. per person" value={`$${g.perPerson}`} />
          {g.savingsPct > 0 ? (
            <View className="flex-row items-center gap-1.5 mt-2 pt-2 border-t border-border">
              <TrendingDown size={15} color="#3AAFA9" />
              <Text className="text-[13px] font-semibold text-primary-dark">Save ~{g.savingsPct}% vs. riding solo</Text>
            </View>
          ) : null}
        </>
      ) : (
        <Text className="text-center text-[12px] font-semibold text-accent py-2">This ride is full</Text>
      )}
    </Pressable>
  );
}

export default function RideBrowseList({ rideId, listHeader }) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (p, replace) => {
    try {
      const res = await groupsApi.browse({ page: p, limit: 10 });
      setTotal(res.total);
      setItems((prev) => (replace ? res.data : [...prev, ...res.data]));
      setPage(p);
    } catch (e) {
      // swallow — empty state handles it
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(1, true);
  }, [load]);

  const onEndReached = () => {
    if (loadingMore || loading) return;
    if (items.length >= total) return;
    setLoadingMore(true);
    load(page + 1, false);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#3AAFA9" size="large" />
      </View>
    );
  }

  return (
    <FlatList
      testID="browse-list"
      className="flex-1 bg-bg"
      data={items}
      keyExtractor={(g) => String(g.id)}
      renderItem={({ item }) => <GroupCard g={item} rideId={rideId} />}
      ListHeaderComponent={listHeader}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 24 }}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(1, true); }} tintColor="#3AAFA9" />}
      ListEmptyComponent={
        <View className="items-center px-8 py-16">
          <View className="w-20 h-20 rounded-full bg-primary-light items-center justify-center mb-4">
            <Search size={32} color="#3AAFA9" />
          </View>
          <Text className="text-lg font-bold text-text mb-1">No rides available</Text>
          <Text className="text-sm text-text-3 text-center leading-5">
            No open groups match right now. Create a ride to start your own group.
          </Text>
        </View>
      }
      ListFooterComponent={loadingMore ? <ActivityIndicator color="#3AAFA9" style={{ marginVertical: 16 }} /> : null}
    />
  );
}
