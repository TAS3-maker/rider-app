import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';

function Row({ icon, label, value }) {
  return (
    <View className="flex-row items-center px-4 py-3.5 border-b border-border">
      <Ionicons name={icon} size={18} color="#8A8A9A" />
      <Text className="ml-3 text-sm text-text-3 flex-1">{label}</Text>
      <Text className="text-sm font-medium text-text">{value || '—'}</Text>
    </View>
  );
}

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();

  const onLogout = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  const initials = (user?.name || user?.username || user?.email || '?')
    .trim()
    .slice(0, 1)
    .toUpperCase();

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-5 py-3">
        <Text testID="profile-title" className="text-[22px] font-extrabold text-text">Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="items-center py-4">
          <View className="w-20 h-20 rounded-full bg-primary-light items-center justify-center mb-3">
            <Text className="text-2xl font-bold text-primary-dark">{initials}</Text>
          </View>
          <Text testID="profile-name" className="text-lg font-bold text-text">
            {user?.name || user?.username || 'Student'}
          </Text>
          <Text className="text-sm text-text-3">{user?.email}</Text>

          <View className="flex-row items-center mt-2 bg-maize-light px-3 py-1 rounded-full">
            <Ionicons name="star" size={14} color="#B8860B" />
            <Text className="ml-1 text-[12px] font-bold text-[#B8860B]">
              {Number(user?.reliabilityScore ?? 5).toFixed(1)} reliability
            </Text>
          </View>
        </View>

        <View
          className="mx-5 rounded-[14px] bg-white overflow-hidden mb-5"
          style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 }}
        >
          <Row icon="person-outline" label="Username" value={user?.username} />
          <Row icon="card-outline" label="Payment handle" value={user?.paymentHandle} />
          <Row icon="location-outline" label="Pickup address" value={user?.pickupAddress} />
          <Row icon="call-outline" label="Phone" value={user?.phone} />
        </View>

        <View className="px-5">
          <Button title="Log Out" variant="outline" onPress={onLogout} testID="profile-logout" />
        </View>
      </ScrollView>
    </View>
  );
}
