import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Bell, Plane, TrendingDown, Users, ChevronRight, Plus } from 'lucide-react-native';
import { ridesApi } from '@/api/rides';
import { calendarApi } from '@/api/social';
import { useSocket } from '@/context/SocketContext';
import { formatDate, shortDate } from '@/lib/format';
import StatusTag from '@/components/StatusTag';

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { unreadCount } = useSocket();
  const [upcoming, setUpcoming] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let on = true;
    (async () => {
      try {
        const [h, c] = await Promise.all([ridesApi.history(1, 10), calendarApi.list(1, 3)]);
        if (!on) return;
        const active = (h.data || []).find((x) => !['cancelled', 'completed'].includes(x.status));
        setUpcoming(active || null);
        setEvents(c.data || []);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, []));

  const nearest = events[0];

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-5 py-3">
        <Text testID="home-title" className="text-[22px] font-extrabold text-text">Home</Text>
        <Pressable testID="home-notifications" onPress={() => router.push('/notifications')} className="w-9 h-9 rounded-full bg-white items-center justify-center border border-border">
          <Bell size={18} color="#1A1A2E" />
          {unreadCount > 0 ? (
            <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent items-center justify-center" testID="home-unread-badge">
              <Text className="text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#3AAFA9" size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <Text className="px-5 pt-3 pb-2 text-[13px] font-bold text-text-3 uppercase tracking-wide">Your Upcoming Ride</Text>
          {upcoming ? (
            <Pressable testID="home-upcoming" onPress={() => router.push({ pathname: '/group', params: { id: upcoming.id } })} className="mx-5 rounded-[14px] bg-white p-4 border border-border">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[15px] font-bold text-text">{upcoming.direction === 'airport_to_university' ? 'Airport → Campus' : 'Campus → Airport'}</Text>
                <StatusTag status={upcoming.status} />
              </View>
              <View className="flex-row justify-between py-0.5"><Text className="text-[13px] text-text-3">Date</Text><Text className="text-[13px] font-semibold text-text">{formatDate(upcoming.travelDate)}</Text></View>
              {upcoming.saved != null ? (
                <View className="flex-row items-center gap-1.5 mt-2 pt-2 border-t border-border">
                  <TrendingDown size={15} color="#3AAFA9" />
                  <Text className="text-[13px] font-semibold text-primary-dark">You saved ${upcoming.saved.toFixed(2)}</Text>
                </View>
              ) : null}
            </Pressable>
          ) : (
            <View className="mx-5 rounded-[14px] bg-white p-6 border border-border items-center" testID="home-empty">
              <View className="w-20 h-20 rounded-full bg-primary-light items-center justify-center mb-4"><Plane size={34} color="#3AAFA9" strokeWidth={1.5} /></View>
              <Text className="text-lg font-bold text-text mb-1">No active ride</Text>
              <Text className="text-sm text-text-3 text-center leading-5 mb-2 max-w-[260px]">Post your trip and we&rsquo;ll match you with students on your flight.</Text>
              {nearest ? (
                <View className="flex-row items-center gap-1.5 mb-4">
                  <Users size={13} color="#FF6B6B" />
                  <Text className="text-[12px] font-semibold text-accent">{nearest.demandCount} student{nearest.demandCount === 1 ? '' : 's'} looking for {nearest.title}</Text>
                </View>
              ) : null}
              <Pressable testID="home-create-ride" onPress={() => router.push('/(tabs)/create')} className="bg-primary px-6 py-3 rounded-[12px] flex-row items-center gap-2">
                <Plus size={16} color="#fff" /><Text className="text-white font-semibold text-sm">Create a Ride</Text>
              </Pressable>
              <Pressable testID="home-notify-me" onPress={() => router.push('/calendar')} className="mt-2 px-6 py-2">
                <Text className="text-primary-dark font-semibold text-[13px]">Notify me about breaks</Text>
              </Pressable>
            </View>
          )}

          <View className="flex-row items-center justify-between px-5 pt-5 pb-2">
            <Text className="text-[13px] font-bold text-text-3 uppercase tracking-wide">Upcoming Breaks</Text>
            <Pressable testID="home-see-calendar" onPress={() => router.push('/calendar')} className="flex-row items-center">
              <Text className="text-[12px] font-semibold text-primary-dark">See all</Text>
              <ChevronRight size={14} color="#2B8A85" />
            </Pressable>
          </View>
          {events.map((ev) => (
            <Pressable key={ev.id} testID={`home-break-${ev.id}`} onPress={() => router.push('/calendar')} className="mx-5 mb-2 rounded-[14px] bg-white p-3.5 border border-border flex-row items-center justify-between" style={ev.highDemand ? { borderColor: '#FF6B6B', borderWidth: 1.5 } : undefined}>
              <View>
                <Text className="text-[14px] font-bold text-text">{ev.title}</Text>
                <Text className="text-[12px] text-text-3 mt-0.5">{shortDate(ev.startDate)}{ev.endDate ? ` – ${shortDate(ev.endDate)}` : ''}</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Users size={13} color={ev.highDemand ? '#FF6B6B' : '#3AAFA9'} />
                <Text className={`text-[12px] font-bold ${ev.highDemand ? 'text-accent' : 'text-primary-dark'}`}>{ev.demandCount}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
