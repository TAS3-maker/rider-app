import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Star, Check, X, ShieldCheck } from 'lucide-react-native';
import { ratingsApi } from '@/api/social';
import ScreenHeader from '@/components/ScreenHeader';

function Stars({ value, onChange, testIDPrefix }) {
  return (
    <View className="flex-row gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} testID={`${testIDPrefix}-${n}`} onPress={() => onChange(n)} hitSlop={6}>
          <Star size={26} color="#F5C842" fill={n <= value ? '#F5C842' : 'transparent'} />
        </Pressable>
      ))}
    </View>
  );
}

export default function Rate() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { groupId } = useLocalSearchParams();
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({}); // userId -> { reliability, punctuality, confirmed }
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    let on = true;
    if (!groupId) { setLoading(false); return () => { on = false; }; }
    ratingsApi.pending(groupId)
      .then((r) => {
        if (!on) return;
        const list = (r.data || []).filter((m) => !m.alreadyRated);
        setMembers(list);
        const init = {};
        list.forEach((m) => { init[m.userId] = { reliability: 5, punctuality: 5, confirmed: true }; });
        setForm(init);
      })
      .finally(() => on && setLoading(false));
    return () => { on = false; };
  }, [groupId]));

  const setField = (uid, key, val) => setForm((f) => ({ ...f, [uid]: { ...f[uid], [key]: val } }));

  const submit = async () => {
    setBusy(true); setError('');
    try {
      for (const m of members) {
        const v = form[m.userId];
        await ratingsApi.submit({ groupId, toUser: m.userId, reliabilityStars: v.reliability, punctualityStars: v.punctuality, confirmed: v.confirmed });
      }
      router.replace('/(tabs)/home');
    } catch (e) {
      setError(e.message || 'Could not submit ratings');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-bg">
      <ScreenHeader title="Rate Riders" testID="rate-header" />
      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#3AAFA9" size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24 }}>
          <View className="flex-row items-center gap-1.5 mx-5 mb-3">
            <ShieldCheck size={14} color="#8A8A9A" />
            <Text className="text-[12px] text-text-3">Ratings are anonymous to the rated rider.</Text>
          </View>
          {members.length === 0 ? (
            <View className="items-center px-8 py-16">
              <View className="w-20 h-20 rounded-full bg-primary-light items-center justify-center mb-4"><Star size={30} color="#3AAFA9" /></View>
              <Text className="text-lg font-bold text-text mb-1">All set</Text>
              <Text className="text-sm text-text-3 text-center">You&rsquo;ve rated everyone in this group.</Text>
            </View>
          ) : (
            members.map((m) => {
              const v = form[m.userId];
              return (
                <View key={m.userId} className="mx-5 mb-3 rounded-[14px] bg-white p-4 border border-border" testID={`rate-card-${m.userId}`}>
                  <View className="flex-row items-center gap-3 mb-3">
                    <View className="w-10 h-10 rounded-full bg-primary-light items-center justify-center"><Text className="text-[13px] font-bold text-primary-dark">{m.initials}</Text></View>
                    <Text className="text-[15px] font-bold text-text">{m.name}</Text>
                  </View>
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-[13px] text-text-2">Reliability</Text>
                    <Stars value={v.reliability} onChange={(n) => setField(m.userId, 'reliability', n)} testIDPrefix={`rate-rel-${m.userId}`} />
                  </View>
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-[13px] text-text-2">Punctuality</Text>
                    <Stars value={v.punctuality} onChange={(n) => setField(m.userId, 'punctuality', n)} testIDPrefix={`rate-pun-${m.userId}`} />
                  </View>
                  <View className="flex-row gap-2">
                    <Pressable testID={`rate-confirmed-${m.userId}`} onPress={() => setField(m.userId, 'confirmed', true)} style={{ flex: 1 }} className={`flex-row items-center justify-center gap-1.5 py-2.5 rounded-[10px] border-[1.5px] ${v.confirmed ? 'bg-primary-light border-primary' : 'bg-white border-border'}`}>
                      <Check size={15} color={v.confirmed ? '#2B8A85' : '#8A8A9A'} />
                      <Text className={`text-[13px] font-semibold ${v.confirmed ? 'text-primary-dark' : 'text-text-3'}`}>Confirmed</Text>
                    </Pressable>
                    <Pressable testID={`rate-flaked-${m.userId}`} onPress={() => setField(m.userId, 'confirmed', false)} style={{ flex: 1 }} className={`flex-row items-center justify-center gap-1.5 py-2.5 rounded-[10px] border-[1.5px] ${!v.confirmed ? 'bg-accent-light border-accent' : 'bg-white border-border'}`}>
                      <X size={15} color={!v.confirmed ? '#FF6B6B' : '#8A8A9A'} />
                      <Text className={`text-[13px] font-semibold ${!v.confirmed ? 'text-accent' : 'text-text-3'}`}>Flaked</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
          {error ? <Text testID="rate-error" className="px-5 mb-2 text-[13px] text-accent">{error}</Text> : null}
          {members.length ? (
            <View className="px-5">
              <Pressable testID="rate-submit" onPress={submit} disabled={busy} className="w-full py-4 rounded-[14px] bg-primary items-center">
                {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-base font-semibold text-white">Submit Ratings</Text>}
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
