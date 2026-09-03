import { useCallback, useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { CalendarDays, Users, Plus } from 'lucide-react-native';
import { calendarApi } from '@/api/social';
import ScreenHeader from '@/components/ScreenHeader';
import { shortDate } from '@/lib/format';

function EventCard({ ev, onPost }) {
  const range = ev.endDate ? `${shortDate(ev.startDate)} – ${shortDate(ev.endDate)}` : shortDate(ev.startDate);
  const start = new Date(ev.startDate);
  return (
    <View
      testID={`calendar-card-${ev.id}`}
      className="mx-5 mb-3 rounded-[14px] bg-white p-4 border border-border"
      style={ev.highDemand ? { borderColor: '#FF6B6B', borderWidth: 1.5 } : undefined}
    >
      <View className="flex-row items-center gap-3">
        <View className={`w-14 h-14 rounded-[12px] items-center justify-center ${ev.highDemand ? 'bg-accent-light' : 'bg-primary-light'}`}>
          <Text className={`text-[10px] font-bold uppercase ${ev.highDemand ? 'text-accent' : 'text-primary-dark'}`}>{start.toLocaleDateString('en-US', { month: 'short' })}</Text>
          <Text className={`text-[18px] font-extrabold ${ev.highDemand ? 'text-accent' : 'text-primary-dark'}`}>{start.getDate()}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-bold text-text">{ev.title}</Text>
          <Text className="text-[12px] text-text-3 mt-0.5">{range}</Text>
          <View className="flex-row items-center gap-1 mt-1.5">
            <Users size={13} color={ev.highDemand ? '#FF6B6B' : '#3AAFA9'} />
            <Text className={`text-[12px] font-semibold ${ev.highDemand ? 'text-accent' : 'text-primary-dark'}`}>{ev.demandCount} student{ev.demandCount === 1 ? '' : 's'} looking</Text>
          </View>
        </View>
      </View>
      <Pressable testID={`calendar-post-${ev.id}`} onPress={onPost} className="mt-3 py-2.5 rounded-[10px] bg-primary items-center flex-row justify-center gap-1.5">
        <Plus size={15} color="#fff" />
        <Text className="text-[13px] font-semibold text-white">Post a Ride for a Break</Text>
      </Pressable>
    </View>
  );
}

export default function Calendar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (p, replace) => {
    try {
      const res = await calendarApi.list(p, 15);
      setTotal(res.total);
      setItems((prev) => (replace ? res.data : [...prev, ...res.data]));
      setPage(p);
    } finally {
      setLoading(false); setLoadingMore(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(1, true); }, [load]));

  return (
    <View className="flex-1 bg-bg">
      <ScreenHeader title="Travel Calendar" testID="calendar-header" />
      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#3AAFA9" size="large" /></View>
      ) : (
        <FlatList
          testID="calendar-list"
          data={items}
          keyExtractor={(e) => String(e.id)}
          renderItem={({ item }) => <EventCard ev={item} onPost={() => router.push('/(tabs)/create')} />}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24 }}
          onEndReached={() => { if (!loadingMore && items.length < total) { setLoadingMore(true); load(page + 1, false); } }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View className="items-center px-8 py-16">
              <View className="w-20 h-20 rounded-full bg-primary-light items-center justify-center mb-4"><CalendarDays size={30} color="#3AAFA9" /></View>
              <Text className="text-lg font-bold text-text mb-1">No breaks scheduled</Text>
              <Text className="text-sm text-text-3 text-center">Upcoming campus breaks will appear here.</Text>
            </View>
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator color="#3AAFA9" style={{ marginVertical: 16 }} /> : null}
        />
      )}
    </View>
  );
}
