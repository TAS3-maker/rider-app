import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Star, MapPin, Clock, Car, Luggage, TrendingDown, LogOut, MessageCircle, UserCheck, Receipt } from 'lucide-react-native';
import { groupsApi } from '@/api/rides';
import { useAuth } from '@/context/AuthContext';
import StatusTag from '@/components/StatusTag';
import ScreenHeader from '@/components/ScreenHeader';
import { formatTime, formatDate, countdown } from '@/lib/format';

function Row({ label, value, valueClass = 'text-text', testID }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-[13px] text-text-3">{label}</Text>
      <Text testID={testID} className={`text-[13px] font-semibold ${valueClass}`}>{value}</Text>
    </View>
  );
}

export default function GroupDetails() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { id, rideId } = useLocalSearchParams();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await groupsApi.get(id);
      setGroup(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-bg">
        <ScreenHeader title="Ride Group" />
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#3AAFA9" size="large" /></View>
      </View>
    );
  }
  if (!group) {
    return (
      <View className="flex-1 bg-bg">
        <ScreenHeader title="Ride Group" />
        <Text className="text-center text-text-3 mt-10">{error || 'Group not found'}</Text>
      </View>
    );
  }

  const isMember = (group.members || []).some((m) => String(m.userId) === String(user?.id));
  const isBooker = group.isCurrentUserBooker;
  const booked = ['confirmed', 'in_progress', 'completed'].includes(group.status);
  const cd = countdown(group.bookingDeadline);

  async function act(fn) {
    setBusy(true);
    setError('');
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  const doJoin = () => act(async () => { await groupsApi.join(id, rideId); });
  const doLeave = () => { setConfirmLeave(false); act(async () => { await groupsApi.leave(id); router.back(); }); };
  const doAcceptBooker = () => act(async () => { await groupsApi.setBooker(id, user.id); });
  const doBook = () => act(async () => { await groupsApi.book(id); router.push({ pathname: '/fare-split', params: { groupId: id } }); });

  return (
    <View className="flex-1 bg-bg">
      <ScreenHeader title="Ride Group" testID="group-header" />
      <ScrollView contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24 }}>
        {/* Pinned ride info */}
        <View className="mx-5 mb-4 rounded-[14px] bg-white p-4 border-l-[3px] border-primary" style={{ borderWidth: 1, borderColor: '#E8E8E8', borderLeftWidth: 3, borderLeftColor: '#3AAFA9' }}>
          <View className="flex-row items-center justify-between mb-2.5">
            <Text testID="group-route" className="text-[16px] font-extrabold text-text">
              {group.direction === 'airport_to_university' ? 'Airport → Campus' : 'Campus → Airport'}
            </Text>
            <StatusTag status={group.status} memberCount={group.memberCount} capacity={group.capacity} testID="group-status" />
          </View>
          <Row label="Date" value={formatDate(group.travelDate)} />
          <Row label="Suggested departure" value={`~${formatTime(group.suggestedDeparture)}`} />
          <View className="flex-row justify-between py-1">
            <Text className="text-[13px] text-text-3">Book by</Text>
            <Text testID="group-countdown" className={`text-[13px] font-bold ${cd.urgent ? 'text-accent' : 'text-text'}`}>
              {formatTime(group.bookingDeadline)} {cd.text ? `(${cd.text})` : ''}
            </Text>
          </View>
          <Row label="Vehicle" value={`${group.vehicleSuggestion || 'UberX'} recommended`} />
          <Row label="Total bags" value={`${group.totalBags || 0} checked`} />
          <Row label="Est. fare" value={`$${group.estimatedTotalFare} · ~$${group.perPerson}/person`} />
          {group.savingsPct > 0 ? (
            <View className="flex-row items-center gap-1.5 mt-2 pt-2 border-t border-border">
              <TrendingDown size={15} color="#3AAFA9" />
              <Text className="text-[13px] font-semibold text-primary-dark">Save ~{group.savingsPct}% vs. ${group.soloFareEstimate} solo</Text>
            </View>
          ) : null}
        </View>

        {/* Riders */}
        <Text className="px-5 pb-2 text-[13px] font-bold text-text-3 uppercase tracking-wide">Riders</Text>
        <View className="mx-5 mb-4 rounded-[14px] bg-white p-2 border border-border">
          {(group.members || []).map((m, i) => (
            <View key={String(m.userId)} className={`flex-row items-center gap-3 px-2 py-2.5 ${i < group.members.length - 1 ? 'border-b border-[#F2F2EF]' : ''}`} testID={`group-rider-${i}`}>
              <View className="w-10 h-10 rounded-full bg-primary-light items-center justify-center">
                <Text className="text-[13px] font-bold text-primary-dark">{m.initials}</Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-[14px] font-semibold text-text">{m.name}</Text>
                  {m.isBooker ? (
                    <View className="px-1.5 py-0.5 rounded bg-primary">
                      <Text className="text-[9px] font-bold text-white tracking-wide">BOOKER</Text>
                    </View>
                  ) : null}
                </View>
                <View className="flex-row items-center gap-1 mt-0.5">
                  <Text className="text-[12px] text-text-3">Flight {formatTime(m.flightTime)} · {m.checkedBags} bag{m.checkedBags === 1 ? '' : 's'}</Text>
                  {m.reliabilityScore != null ? (
                    <View className="flex-row items-center gap-0.5 ml-1">
                      <Star size={11} color="#F5C842" fill="#F5C842" />
                      <Text className="text-[12px] text-text-3">{m.reliabilityScore}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Booker-only: private pickup addresses */}
        {isBooker ? (
          <>
            <Text className="px-5 pb-2 text-[13px] font-bold text-text-3 uppercase tracking-wide">Pickup addresses (booker only)</Text>
            <View className="mx-5 mb-4 rounded-[14px] bg-white p-3 border border-border" testID="group-pickups">
              {(group.members || []).map((m) => (
                <View key={String(m.userId)} className="flex-row items-start gap-2 py-1.5">
                  <MapPin size={14} color="#3AAFA9" style={{ marginTop: 2 }} />
                  <Text className="flex-1 text-[13px] text-text-2">
                    <Text className="font-semibold text-text">{m.name}: </Text>
                    {m.pickupAddress || 'No address provided'}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {error ? <Text testID="group-error" className="px-5 mb-2 text-[13px] text-accent">{error}</Text> : null}

        {/* Actions */}
        <View className="px-5 gap-2.5">
          {group.noBookerFlag && isMember ? (
            <Pressable testID="group-accept-booker" onPress={doAcceptBooker} disabled={busy} className="w-full py-3.5 rounded-[12px] bg-maize items-center flex-row justify-center gap-2">
              <UserCheck size={18} color="#1A1A2E" />
              <Text className="text-[15px] font-bold text-text">Accept Booker Role</Text>
            </Pressable>
          ) : null}

          {isMember ? (
            <>
              {isBooker && !booked ? (
                <Pressable testID="group-book-now" onPress={doBook} disabled={busy} className="w-full py-4 rounded-[14px] bg-primary items-center flex-row justify-center gap-2">
                  {busy ? <ActivityIndicator color="#fff" /> : <Car size={18} color="#fff" />}
                  <Text className="text-base font-semibold text-white">Book Now</Text>
                </Pressable>
              ) : null}
              {booked ? (
                <Pressable testID="group-fare-split" onPress={() => router.push({ pathname: '/fare-split', params: { groupId: id } })} className="w-full py-4 rounded-[14px] bg-primary items-center flex-row justify-center gap-2">
                  <Receipt size={18} color="#fff" />
                  <Text className="text-base font-semibold text-white">Fare Split</Text>
                </Pressable>
              ) : null}
              <View className="flex-row gap-2.5">
                <Pressable testID="group-chat" onPress={() => router.push('/group-chat')} className="flex-1 py-3.5 rounded-[12px] bg-white border border-border items-center flex-row justify-center gap-2">
                  <MessageCircle size={17} color="#1A1A2E" />
                  <Text className="text-[15px] font-semibold text-text">Group Chat</Text>
                </Pressable>
                <Pressable testID="group-leave" onPress={() => setConfirmLeave(true)} className="px-5 py-3.5 rounded-[12px] bg-white border border-border items-center justify-center">
                  <LogOut size={18} color="#FF6B6B" />
                </Pressable>
              </View>
            </>
          ) : rideId ? (
            <Pressable testID="group-join" onPress={doJoin} disabled={busy || group.status === 'full'} className="w-full py-4 rounded-[14px] bg-primary items-center flex-row justify-center gap-2" style={{ opacity: group.status === 'full' ? 0.5 : 1 }}>
              {busy ? <ActivityIndicator color="#fff" /> : null}
              <Text className="text-base font-semibold text-white">{group.status === 'full' ? 'Group Full' : 'Join This Ride'}</Text>
            </Pressable>
          ) : (
            <Pressable testID="group-create-to-join" onPress={() => router.push('/(tabs)/create')} className="w-full py-4 rounded-[14px] bg-primary items-center">
              <Text className="text-base font-semibold text-white">Create a Ride to Join</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Leave confirmation */}
      <Modal transparent visible={confirmLeave} animationType="fade" onRequestClose={() => setConfirmLeave(false)}>
        <View className="flex-1 bg-black/40 items-center justify-center px-8">
          <View className="w-full bg-white rounded-[16px] p-5">
            <Text className="text-[17px] font-bold text-text mb-1.5">Leave this group?</Text>
            <Text className="text-[14px] text-text-3 leading-5 mb-4">
              {booked ? 'The cab is already booked — you may still owe your share.' : 'Your spot will be freed up for another rider.'}
            </Text>
            <View className="flex-row gap-2.5">
              <Pressable testID="leave-cancel" onPress={() => setConfirmLeave(false)} className="flex-1 py-3 rounded-[12px] bg-bg items-center">
                <Text className="text-[15px] font-semibold text-text-2">Stay</Text>
              </Pressable>
              <Pressable testID="leave-confirm" onPress={doLeave} className="flex-1 py-3 rounded-[12px] bg-accent items-center">
                <Text className="text-[15px] font-semibold text-white">Leave</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
