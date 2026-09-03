import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';

export default function SignUp() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useAuth();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    paymentHandle: '',
    pickupAddress: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async () => {
    setError('');
    if (!form.email || !form.password) return setError('Email and password are required');
    setLoading(true);
    try {
      const res = await register({
        username: form.username.trim(),
        name: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        paymentHandle: form.paymentHandle.trim(),
        pickupAddress: form.pickupAddress.trim(),
      });
      router.push({
        pathname: '/(auth)/verify',
        params: { email: form.email.trim(), devCode: res.devVerificationCode || '' },
      });
    } catch (e) {
      setError(e.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="px-5 pt-6 pb-6">
            <Text className="text-[26px] font-extrabold text-text mb-1">Create account</Text>
            <Text className="text-sm text-text-3">Only verified university emails accepted</Text>
          </View>

          <Input label="Username" value={form.username} onChangeText={set('username')} placeholder="jdoe" testID="signup-username" />
          <Input
            label="University Email"
            value={form.email}
            onChangeText={set('email')}
            placeholder="you@university.edu"
            keyboardType="email-address"
            testID="signup-email"
          />
          <Input label="Password" value={form.password} onChangeText={set('password')} placeholder="••••••••" secureTextEntry testID="signup-password" />
          <Input label="Venmo or Zelle handle" value={form.paymentHandle} onChangeText={set('paymentHandle')} placeholder="@yourhandle" testID="signup-payment" />
          <Input label="Pickup Address (private)" value={form.pickupAddress} onChangeText={set('pickupAddress')} placeholder="123 State St, Ann Arbor" autoCapitalize="words" testID="signup-pickup" />

          {error ? (
            <Text testID="signup-error" className="px-5 mb-3 text-sm text-accent">
              {error}
            </Text>
          ) : null}

          <View className="px-5 mt-2">
            <Button title="Create Account" onPress={onSubmit} loading={loading} testID="signup-submit" />
          </View>

          <Text className="text-center mt-3 text-[11px] text-text-3 px-10 leading-5">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </Text>

          <View className="flex-row justify-center mt-4">
            <Text className="text-[13px] text-text-3">Already have an account? </Text>
            <Pressable testID="signup-goto-signin" onPress={() => router.replace('/(auth)/signin')}>
              <Text className="text-[13px] font-semibold text-primary">Sign In</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
