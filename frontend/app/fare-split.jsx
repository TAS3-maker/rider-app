import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { CheckCircle2, Copy, Check, Clock, Star } from 'lucide-react-native';
import { groupsApi, faresApi } from '@/api/rides';
import { useAuth } from '@/context/AuthContext';
import ScreenHeader from '@/components/ScreenHeader';

export default function FareSplit() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { groupId } = useLocalSearchParams();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fareInput, setFareInput] = useState('');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await groupsApi.get(groupId);
      setGroup(res.data);
      if (res.data.fare) setFareInput(String(res.data.fare.totalCost));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View className="flex-1 bg-bg">
        <ScreenHeader title="Fare Split" />
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#3AAFA9" size="large" /></View>
      </View>
    );
  }
  if (!group) {
    return (
      <View className="flex-1 bg-bg">
        <ScreenHeader title="Fare Split" />
        <Text className="text-center text-text-3 mt-10">{error || 'Not found'}</Text>
      </View>
    );
  }

  const fare = group.fare;
  const isBooker = group.isCurrentUserBooker;
  const nameOf = (uid) => {
    const m = (group.members || []).find((x) => String(x.userId) === String(uid));
    return m ? m.name : 'Rider';
  };
  const myShare = fare && (fare.shares || []).find((s) => String(s.user) === String(user?.id));

  async function act(fn) {
    setBusy(true); setError('');
    try { await fn(); await load(); } catch (e) { setError(e.message || 'Something went wrong'); } finally { setBusy(false); }
  }

  const saveFare = () => {
    const val = parseFloat(fareInput);
    if (!val || val <= 0) return setError('Enter a valid fare amount');
    act(async () => { await faresApi.enter(groupId, val); });
  };
  const confirmMine = () => act(async () => { await faresApi.confirm(groupId); });
  const completeRide = () => act(async () => { await groupsApi.complete(groupId); router.push('/rate'); });

  const copyPay = async () => {
    if (!myShare) return;
    await Clipboard.setStringAsync(`$${myShare.amount} to ${fare.bookerPaymentHandle || 'booker'}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <View className="flex-1 bg-bg">
      <ScreenHeader title="Fare Split" testID="fare-header" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
          {/* Booker: enter actual fare */}
          {isBooker ? (
            <View className="mx-5 mb-4 rounded-[14px] bg-white p-4 border border-border">
              <Text className="text-[13px] font-semibold text-text-2 mb-2">Actual cab fare (booker)</Text>
              <View className="flex-row items-center gap-2">
                <View className="flex-1 flex-row items-center px-4 rounded-[10px] border-[1.5px] border-border bg-bg">
                  <Text className="text-[18px] font-bold text-text-3">$</Text>
                  <TextInput
                    testID="fare-input"
                    value={fareInput}
                    onChangeText={setFareInput}
                    keyboardType="decimal-pad"
                    placeholder="57.00"
                    placeholderTextColor="#8A8A9A"
                    className="flex-1 py-3 text-[18px] font-bold text-text"
                  />
                </View>
                <Pressable testID="fare-save" onPress={saveFare} disabled={busy} className="px-5 py-3 rounded-[10px] bg-primary items-center justify-center">
                  {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-[15px] font-semibold text-white">{fare ? 'Update' : 'Split'}</Text>}
                </Pressable>
              </View>
              {fare && fare.fareChanged ? <Text className="text-[12px] text-maize mt-2">Fare was updated — shares recalculated.</Text> : null}
            </View>
          ) : null}

          {/* Shares */}
          {fare ? (
            <View className="mx-5 mb-4 rounded-[16px] bg-white p-5 border border-border items-stretch">
              <View className="items-center mb-3">
                <View className="w-12 h-12 rounded-full bg-primary items-center justify-center mb-2">
                  <CheckCircle2 size={26} color="#fff" />
                </View>
                <Text className="text-[17px] font-extrabold text-text">Fare Ready</Text>
              </View>
              <View className="flex-row justify-between py-2 border-b border-[#F2F2EF]">
                <Text className="text-[14px] text-text-3">Total fare</Text>
                <Text testID="fare-total" className="text-[15px] font-bold text-text">${fare.totalCost.toFixed(2)}</Text>
              </View>
              {(fare.shares || []).map((s) => {
                const mine = String(s.user) === String(user?.id);
                return (
                  <View key={String(s.user)} className="flex-row justify-between py-2 border-b border-[#F2F2EF]">
                    <Text className={`text-[14px] ${mine ? 'font-bold text-text' : 'text-text-2'}`}>
                      {nameOf(s.user)}{mine ? ' (You)' : ''} · {s.percent}%
                    </Text>
                    <Text className={`text-[15px] font-bold ${mine ? 'text-primary-dark' : 'text-text'}`}>${s.amount.toFixed(2)}</Text>
                  </View>
                );
              })}

              {myShare && !myShare.paymentConfirmed ? (
                <Pressable testID="fare-copy" onPress={copyPay} className="mt-4 w-full py-3.5 rounded-[12px] bg-primary items-center flex-row justify-center gap-2">
                  {copied ? <Check size={18} color="#fff" /> : <Copy size={17} color="#fff" />}
                  <Text className="text-[15px] font-semibold text-white">
                    {copied ? 'Copied!' : `Copy $${myShare.amount.toFixed(2)} · Pay ${fare.bookerPaymentHandle || 'booker'}`}
                  </Text>
                </Pressable>
              ) : null}
              {myShare ? (
                <Text className="text-center text-[12px] text-text-3 mt-2">Tap to copy amount and payment handle</Text>
              ) : null}
            </View>
          ) : (
            <View className="mx-5 mb-4 rounded-[14px] bg-white p-6 border border-border items-center">
              <Clock size={28} color="#8A8A9A" />
              <Text className="text-[15px] font-semibold text-text mt-2">Waiting for the booker</Text>
              <Text className="text-[13px] text-text-3 text-center mt-1">Your share appears once the booker enters the fare.</Text>
            </View>
          )}

          {/* Payment status */}
          {fare ? (
            <View className="mx-5 mb-4 rounded-[14px] bg-white p-4 border border-border">
              <Text className="text-[13px] font-semibold text-text mb-2">Payment Status</Text>
              {(fare.shares || []).map((s, i) => (
                <View key={String(s.user)} className={`flex-row justify-between items-center py-2 ${i < fare.shares.length - 1 ? 'border-b border-[#F2F2EF]' : ''}`} testID={`fare-status-${i}`}>
                  <Text className="text-[13px] text-text-2">{nameOf(s.user)}</Text>
                  {s.paymentConfirmed ? (
                    <View className="flex-row items-center gap-1">
                      <Check size={14} color="#3AAFA9" />
                      <Text className="text-[13px] font-semibold text-primary-dark">Paid</Text>
                    </View>
                  ) : (
                    <Text className="text-[13px] font-semibold text-maize">Pending</Text>
                  )}
                </View>
              ))}
            </View>
          ) : null}

          {error ? <Text testID="fare-error" className="px-5 mb-2 text-[13px] text-accent">{error}</Text> : null}

          <View className="px-5 gap-2.5">
            {myShare && !myShare.paymentConfirmed ? (
              <Pressable testID="fare-mark-paid" onPress={confirmMine} disabled={busy} className="w-full py-4 rounded-[14px] bg-white border-[1.5px] border-primary items-center">
                <Text className="text-base font-semibold text-primary-dark">I've Paid → Mark Confirmed</Text>
              </Pressable>
            ) : null}
            {isBooker && group.status !== 'completed' ? (
              <Pressable testID="fare-complete" onPress={completeRide} disabled={busy} className="w-full py-4 rounded-[14px] bg-primary items-center flex-row justify-center gap-2">
                {busy ? <ActivityIndicator color="#fff" /> : <Star size={18} color="#fff" />}
                <Text className="text-base font-semibold text-white">Complete Ride → Rate Riders</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
