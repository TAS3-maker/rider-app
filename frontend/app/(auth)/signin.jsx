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

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError('');
    if (!email || !password) return setError('Enter your email and password');
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)/home');
    } catch (e) {
      setError(e.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="px-5 pt-6 pb-7">
            <Text className="text-[26px] font-extrabold text-text mb-1">Welcome back</Text>
            <Text className="text-sm text-text-3">Sign in with your university email</Text>
          </View>

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@university.edu"
            keyboardType="email-address"
            testID="signin-email"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            testID="signin-password"
          />

          <Pressable testID="signin-forgot" onPress={() => router.push('/(auth)/forgot')} className="px-5 mb-5">
            <Text className="text-right text-[13px] font-medium text-primary">Forgot password?</Text>
          </Pressable>

          {error ? (
            <Text testID="signin-error" className="px-5 mb-3 text-sm text-accent">
              {error}
            </Text>
          ) : null}

          <View className="px-5">
            <Button title="Sign In" onPress={onSubmit} loading={loading} testID="signin-submit" />
          </View>

          <View className="flex-row justify-center mt-4">
            <Text className="text-[13px] text-text-3">Don't have an account? </Text>
            <Pressable testID="signin-goto-signup" onPress={() => router.replace('/(auth)/signup')}>
              <Text className="text-[13px] font-semibold text-primary">Sign Up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
