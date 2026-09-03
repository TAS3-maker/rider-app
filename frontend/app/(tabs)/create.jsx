import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, UserPlus, Plane, Clock, Info } from 'lucide-react-native';
import { ridesApi, groupsApi, refApi } from '@/api/rides';
import { formatTime, formatDate } from '@/lib/format';

function Chip({ label, active, onPress, testID }) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={{ flexShrink: 0 }}
      className={`px-4 h-10 rounded-[10px] items-center justify-center border-[1.5px] ${
        active ? 'bg-primary-light border-primary' : 'bg-white border-border'
      }`}
    >
      <Text className={`text-[13px] font-semibold ${active ? 'text-primary-dark' : 'text-text-3'}`}>{label}</Text>
    </Pressable>
  );
}

function Section({ label, children }) {
  return (
    <View className="px-5 mb-4">
      <Text className="text-[13px] font-semibold text-text-2 mb-2">{label}</Text>
      {children}
    </View>
  );
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINS = ['00', '15', '30', '45'];
const MIN_MS = 60000;

export default function CreateRide() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [mode, setMode] = useState('public');
  const [direction, setDirection] = useState('university_to_airport');
  const [airports, setAirports] = useState([]);
  const [airportId, setAirportId] = useState(null);
  const [hour, setHour] = useState(5);
  const [minute, setMinute] = useState('15');
  const [ampm, setAmpm] = useState('PM');
  const [dayOffset, setDayOffset] = useState(1);
  const [bags, setBags] = useState(1);
  const [flexible, setFlexible] = useState(false);
  const [flightInfo, setFlightInfo] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    refApi
      .airports()
      .then((r) => {
        setAirports(r.data || []);
        if (r.data && r.data[0]) setAirportId(r.data[0].id);
      })
      .catch(() => {});
  }, []);

  const days = useMemo(() => {
    const out = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let i = 0; i < 21; i++) {
      const d = new Date(base.getTime() + i * 86400000);
      out.push(d);
    }
    return out;
  }, []);

  const flightDate = useMemo(() => {
    const d = new Date(days[dayOffset]);
    let h = hour % 12;
    if (ampm === 'PM') h += 12;
    d.setHours(h, parseInt(minute, 10), 0, 0);
    return d;
  }, [days, dayOffset, hour, minute, ampm]);

  const departure = new Date(flightDate.getTime() - 165 * MIN_MS);
  const bookBy = new Date(departure.getTime() - 120 * MIN_MS);
  const airport = airports.find((a) => a.id === airportId);
  const code = airport ? airport.code : 'Airport';

  async function submit() {
    setError('');
    if (!airportId) return setError('Please select an airport');
    setSubmitting(true);
    try {
      const y = flightDate.getFullYear();
      const mo = String(flightDate.getMonth() + 1).padStart(2, '0');
      const da = String(flightDate.getDate()).padStart(2, '0');
      const res = await ridesApi.create({
        direction,
        airport: airportId,
        travelDate: `${y}-${mo}-${da}`,
        flightTime: flightDate.toISOString(),
        checkedBags: bags,
        flightInfo,
        pickupLocation,
        flexible,
        mode,
      });
      if (mode === 'private') {
        router.push({ pathname: '/group', params: { id: res.group.id } });
      } else if (res.matchCount > 0) {
        router.push({ pathname: '/browse', params: { rideId: res.ride.id } });
      } else {
        const g = await groupsApi.create(res.ride.id);
        router.push({ pathname: '/group', params: { id: g.data.id } });
      }
    } catch (e) {
      setError(e.message || 'Could not post your ride');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-5 py-3 border-b border-border">
        <Text testID="create-title" className="text-[22px] font-extrabold text-text">Create Ride</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
          {/* Mode toggle */}
          <View className="mx-5 mb-4 flex-row bg-white rounded-[12px] p-1 border border-border">
            {[
              { k: 'public', label: 'Find Riders', Icon: Users },
              { k: 'private', label: 'Invite Friends', Icon: UserPlus },
            ].map(({ k, label, Icon }) => (
              <Pressable
                key={k}
                testID={`create-mode-${k}`}
                onPress={() => setMode(k)}
                className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-[9px] ${mode === k ? 'bg-primary' : ''}`}
              >
                <Icon size={16} color={mode === k ? '#FFFFFF' : '#8A8A9A'} />
                <Text className={`text-[13px] font-semibold ${mode === k ? 'text-white' : 'text-text-3'}`}>{label}</Text>
              </Pressable>
            ))}
          </View>

          <Section label="Direction">
            <View className="flex-row gap-2">
              <Pressable testID="create-dir-out" onPress={() => setDirection('university_to_airport')} style={{ flex: 1 }} className={`py-3 rounded-[10px] items-center border-[1.5px] ${direction === 'university_to_airport' ? 'bg-primary-light border-primary' : 'bg-white border-border'}`}>
                <Text className={`text-[13px] font-semibold ${direction === 'university_to_airport' ? 'text-primary-dark' : 'text-text-3'}`}>Campus → {code}</Text>
              </Pressable>
              <Pressable testID="create-dir-in" onPress={() => setDirection('airport_to_university')} style={{ flex: 1 }} className={`py-3 rounded-[10px] items-center border-[1.5px] ${direction === 'airport_to_university' ? 'bg-primary-light border-primary' : 'bg-white border-border'}`}>
                <Text className={`text-[13px] font-semibold ${direction === 'airport_to_university' ? 'text-primary-dark' : 'text-text-3'}`}>{code} → Campus</Text>
              </Pressable>
            </View>
          </Section>

          <Section label="Airport">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
              {airports.map((a) => (
                <Chip key={a.id} testID={`create-airport-${a.code}`} label={a.code} active={airportId === a.id} onPress={() => setAirportId(a.id)} />
              ))}
            </ScrollView>
          </Section>

          <Section label="Flight Departure Time">
            <View className="flex-row items-center gap-1.5 mb-2">
              <Clock size={15} color="#3AAFA9" />
              <Text testID="create-flight-time" className="text-[15px] font-bold text-text">{formatTime(flightDate)}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20, marginBottom: 8 }}>
              {HOURS.map((h) => <Chip key={h} label={String(h)} active={hour === h} onPress={() => setHour(h)} testID={`create-hour-${h}`} />)}
            </ScrollView>
            <View className="flex-row gap-2">
              {MINS.map((m) => <Chip key={m} label={`:${m}`} active={minute === m} onPress={() => setMinute(m)} testID={`create-min-${m}`} />)}
              <View className="w-2" />
              {['AM', 'PM'].map((p) => <Chip key={p} label={p} active={ampm === p} onPress={() => setAmpm(p)} testID={`create-ampm-${p}`} />)}
            </View>
          </Section>

          <Section label="Travel Date">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
              {days.map((d, i) => (
                <Chip key={i} testID={`create-day-${i}`} label={`${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.getDate()}`} active={dayOffset === i} onPress={() => setDayOffset(i)} />
              ))}
            </ScrollView>
          </Section>

          <Section label="Airline & Flight # (optional)">
            <TextInput
              testID="create-flightinfo"
              value={flightInfo}
              onChangeText={setFlightInfo}
              placeholder="Delta DL1234"
              placeholderTextColor="#8A8A9A"
              className="px-4 py-3 rounded-[10px] border-[1.5px] border-border bg-white text-[15px] text-text"
            />
          </Section>

          <Section label="Pickup Address">
            <TextInput
              testID="create-pickup"
              value={pickupLocation}
              onChangeText={setPickupLocation}
              placeholder="e.g. Michigan Union, North Quad"
              placeholderTextColor="#8A8A9A"
              className="px-4 py-3 rounded-[10px] border-[1.5px] border-border bg-white text-[15px] text-text"
            />
          </Section>

          <Section label="Checked Bags">
            <View className="flex-row gap-2">
              {[0, 1, 2, 3].map((n) => <Chip key={n} testID={`create-bags-${n}`} label={String(n)} active={bags === n} onPress={() => setBags(n)} />)}
            </View>
          </Section>

          <View className="px-5 mb-4">
            <Pressable testID="create-flexible" onPress={() => setFlexible((f) => !f)} className="flex-row items-center justify-between bg-white rounded-[10px] px-4 py-3.5 border border-border">
              <Text className="text-[14px] text-text">I'm flexible on timing</Text>
              <View className={`w-11 h-6 rounded-full px-0.5 justify-center ${flexible ? 'bg-primary' : 'bg-border'}`}>
                <View className={`w-5 h-5 rounded-full bg-white ${flexible ? 'self-end' : 'self-start'}`} />
              </View>
            </Pressable>
          </View>

          {/* Auto-calculated info box */}
          <View className="mx-5 mb-4 rounded-[14px] p-4 bg-primary-light border border-primary/20">
            <View className="flex-row items-center gap-1.5 mb-2">
              <Info size={14} color="#2B8A85" />
              <Text className="text-[12px] font-bold text-primary-dark">Auto-calculated</Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-[13px] text-text-3">Suggested departure</Text>
              <Text testID="create-departure" className="text-[13px] font-semibold text-text">~{formatTime(departure)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-[13px] text-text-3">Book by</Text>
              <Text testID="create-bookby" className="text-[13px] font-semibold text-accent">{formatTime(bookBy)} · {formatDate(bookBy)}</Text>
            </View>
          </View>

          {error ? <Text testID="create-error" className="px-5 mb-2 text-[13px] text-accent">{error}</Text> : null}

          <View className="px-5">
            <Pressable testID="create-submit" onPress={submit} disabled={submitting} className="w-full py-4 rounded-[14px] bg-primary items-center flex-row justify-center gap-2">
              {submitting ? <ActivityIndicator color="#fff" /> : <Plane size={18} color="#fff" />}
              <Text className="text-base font-semibold text-white">{mode === 'private' ? 'Create & Get Invite Link' : 'Post Ride'}</Text>
            </Pressable>
            {mode === 'private' ? (
              <Text className="text-center text-[12px] text-text-3 mt-2 px-6">
                Share the link with friends. They'll need a .edu email to join.
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
