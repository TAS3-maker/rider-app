import { useCallback, useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Car, Users, UserMinus, MessageCircle, Bell, CalendarClock, DollarSign, Star, Megaphone, RefreshCw, CheckCircle2 } from 'lucide-react-native';
import { notificationsApi } from '@/api/social';
import { useSocket } from '@/context/SocketContext';
import ScreenHeader from '@/components/ScreenHeader';
import { shortDate } from '@/lib/format';

const ICONS = {
  ride_match: Car,
  group_created: Users,
  user_joined: Users,
  user_left: UserMinus,
  chat_message: MessageCircle,
  ride_status: RefreshCw,
  booking_reminder: CalendarClock,
  ride_reminder: CalendarClock,
  fare_confirmation: DollarSign,
  payment_confirmed: DollarSign,
  rating_reminder: Star,
  announcement: Megaphone,
};
// Dot color: yellow for calendar/break/reminders, teal for active, gray for read.
const YELLOW = new Set(['booking_reminder', 'ride_reminder', 'rating_reminder']);

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return shortDate(d);
}

export default function Notifications() {
  const router = useRouter();
  const { refreshUnread, setUnreadCount } = useSocket();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (p, replace) => {
    try {
      const res = await notificationsApi.list(p, 20);
      setTotal(res.total);
      setItems((prev) => (replace ? res.data : [...prev, ...res.data]));
      setPage(p);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(1, true); }, [load]));

  const markAllRead = async () => {
    await notificationsApi.readAll();
    setUnreadCount(0);
    load(1, true);
  };

  const openItem = async (n) => {
    if (!n.read) { try { await notificationsApi.read(n.id); refreshUnread(); } catch {} }
    const gid = n.data && n.data.groupId;
    if (gid && n.type === 'chat_message') router.push({ pathname: '/group-chat', params: { groupId: gid } });
    else if (gid) router.push({ pathname: '/group', params: { id: gid } });
    else if (n.type === 'rating_reminder' && gid) router.push('/rate');
  };

  const renderItem = ({ item }) => {
    const Icon = ICONS[item.type] || Bell;
    const dot = item.read ? 'bg-text-3' : YELLOW.has(item.type) ? 'bg-maize' : 'bg-primary';
    return (
      <Pressable testID={`notif-${item.id}`} onPress={() => openItem(item)} className="flex-row items-center gap-3 mx-4 mb-2 bg-white rounded-[14px] p-3.5 border border-border">
        <View className="w-10 h-10 rounded-full bg-primary-light items-center justify-center">
          <Icon size={18} color="#3AAFA9" />
        </View>
        <View className="flex-1">
          <Text className={`text-[14px] ${item.read ? 'font-medium text-text-2' : 'font-bold text-text'}`}>{item.title}</Text>
          {item.body ? <Text numberOfLines={1} className="text-[12px] text-text-3 mt-0.5">{item.body}</Text> : null}
        </View>
        <View className="items-end gap-1">
          <View className={`w-2.5 h-2.5 rounded-full ${dot}`} />
          <Text className="text-[10px] text-text-3">{timeAgo(item.createdAt)}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-bg">
      <ScreenHeader
        title="Notifications"
        testID="notifications-header"
        right={
          <Pressable testID="notif-read-all" onPress={markAllRead}>
            <CheckCircle2 size={20} color="#3AAFA9" />
          </Pressable>
        }
      />
      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#3AAFA9" size="large" /></View>
      ) : (
        <FlatList
          testID="notifications-list"
          data={items}
          keyExtractor={(n) => String(n.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 24 }}
          onEndReached={() => { if (!loadingMore && items.length < total) { setLoadingMore(true); load(page + 1, false); } }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View className="items-center px-8 py-16">
              <View className="w-20 h-20 rounded-full bg-primary-light items-center justify-center mb-4"><Bell size={30} color="#3AAFA9" /></View>
              <Text className="text-lg font-bold text-text mb-1">No notifications</Text>
              <Text className="text-sm text-text-3 text-center">Ride matches, group updates and reminders will show up here.</Text>
            </View>
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator color="#3AAFA9" style={{ marginVertical: 16 }} /> : null}
        />
      )}
    </View>
  );
}
