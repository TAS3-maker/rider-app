import { useCallback, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Car, PiggyBank } from 'lucide-react-native';
import { ridesApi } from '@/api/rides';
import ScreenHeader from '@/components/ScreenHeader';
import StatusTag from '@/components/StatusTag';
import { formatDate } from '@/lib/format';

function Row({ label, value, valueClass = 'text-text' }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-[13px] text-text-3">{label}</Text>
      <Text className={`text-[13px] font-semibold ${valueClass}`}>{value}</Text>
    </View>
  );
}

function HistoryCard({ item }) {
  const cancelled = item.cancelled;
  const riders = (item.riders || []).map((r) => `${r.name}${r.isBooker ? ' (Booker)' : ''}`).join(', ');
  return (
    <View
      className="mx-5 mb-3 rounded-[14px] bg-white p-4 border border-border"
      style={cancelled ? { borderLeftWidth: 3, borderLeftColor: '#FF6B6B' } : undefined}
      testID={`history-card-${item.id}`}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-[15px] font-bold text-text">
          {item.direction === 'airport_to_university' ? 'Airport → Campus' : 'Campus → Airport'}
        </Text>
        <StatusTag status={item.status} />
      </View>
      <Row label="Date" value={formatDate(item.travelDate)} />
      {cancelled ? (
        <Row label="Reason" value={item.cancelReason || 'Cancelled'} valueClass="text-accent" />
      ) : (
        <>
          {riders ? <Row label="Riders" value={riders} /> : null}
          {item.totalFare != null ? <Row label="Total fare" value={`$${item.totalFare.toFixed(2)}`} /> : null}
          {item.yourShare != null ? <Row label="You paid" value={`$${item.yourShare.toFixed(2)}${item.yourPercent ? ` (${item.yourPercent}%)` : ''}`} /> : null}
          {item.saved != null ? <Row label="You saved" value={`$${item.saved.toFixed(2)}`} valueClass="text-primary-dark" /> : null}
          <Row label="Payment" value={item.paymentConfirmed ? 'Confirmed' : 'Pending'} valueClass={item.paymentConfirmed ? 'text-primary-dark' : 'text-maize'} />
        </>
      )}
    </View>
  );
}

export default function RideHistory() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ completedRides: 0, totalSaved: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (p, replace) => {
    try {
      const res = await ridesApi.history(p, 10);
      setTotal(res.total);
      setSummary(res.summary || { completedRides: 0, totalSaved: 0 });
      setItems((prev) => (replace ? res.data : [...prev, ...res.data]));
      setPage(p);
    } catch (e) {
      // empty state
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(1, true); }, [load]));

  const onEndReached = () => {
    if (loadingMore || loading || items.length >= total) return;
    setLoadingMore(true);
    load(page + 1, false);
  };

  return (
    <View className="flex-1 bg-bg">
      <ScreenHeader title="Ride History" testID="history-header" />
      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#3AAFA9" size="large" /></View>
      ) : (
        <FlatList
          testID="history-list"
          data={items}
          keyExtractor={(x) => String(x.id)}
          renderItem={({ item }) => <HistoryCard item={item} />}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24 }}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            <View className="flex-row mx-5 mb-3 gap-2.5">
              <View className="flex-1 rounded-[14px] bg-white p-4 border border-border">
                <Car size={18} color="#3AAFA9" />
                <Text testID="history-total-rides" className="text-[22px] font-extrabold text-text mt-1">{summary.completedRides}</Text>
                <Text className="text-[12px] text-text-3">Completed rides</Text>
              </View>
              <View className="flex-1 rounded-[14px] bg-white p-4 border border-border">
                <PiggyBank size={18} color="#3AAFA9" />
                <Text testID="history-total-saved" className="text-[22px] font-extrabold text-primary-dark mt-1">${summary.totalSaved.toFixed(2)}</Text>
                <Text className="text-[12px] text-text-3">Total saved</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center px-8 py-16">
              <View className="w-20 h-20 rounded-full bg-primary-light items-center justify-center mb-4">
                <Car size={30} color="#3AAFA9" />
              </View>
              <Text className="text-lg font-bold text-text mb-1">No rides yet</Text>
              <Text className="text-sm text-text-3 text-center leading-5">Your completed and cancelled rides will show up here.</Text>
            </View>
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator color="#3AAFA9" style={{ marginVertical: 16 }} /> : null}
        />
      )}
    </View>
  );
}
