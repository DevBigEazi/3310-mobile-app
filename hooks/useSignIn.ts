import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { dynamicClient } from '../client';
import { BACKEND_URL, AVATARS } from '../constants/config';

export const useSignIn = () => {
  const router = useRouter();
  const client = useReactiveClient(dynamicClient);
  const [authStep, setAuthStep] = useState<'login' | 'decryptor' | 'register'>('login');
  
  // Input fields
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [username, setUsername] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState<'google' | 'passkey' | 'email' | null>(null);

  // Focus reference for OTP boxes
  const otpInputs = useRef<Array<any>>([]);

  // Blink cursor for terminal inputs
  const [cursorVisible, setCursorVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 550);
    return () => clearInterval(interval);
  }, []);

  // Cooldown timer for resending OTP (1 minute)
  const [resendCountdown, setResendCountdown] = useState(0);
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // Handle post-authentication sync with the backend
  useEffect(() => {
    if (!!client.auth.authenticatedUser) {
      handlePostAuth();
    }
  }, [client.auth.authenticatedUser, client.wallets.primary]);

  const handlePostAuth = async () => {
    const address = client.wallets.primary?.address;
    if (!address) return;

    setIsLoading(true);
    try {
      const checkResponse = await fetch(`${BACKEND_URL}/api/player/check/${address}`);
      const checkData = await checkResponse.json();

      if (checkData.exists) {
        const loginResponse = await fetch(`${BACKEND_URL}/api/player`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, username: 'returning-user' }),
        });
        const loginData = await loginResponse.json();

        if (loginData.token) {
          await AsyncStorage.setItem('jwt_token', loginData.token);
          await AsyncStorage.setItem('registered_username', loginData.player.username);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace('/(tabs)/game');
        } else {
          Alert.alert('SYSTEM ERROR', 'Failed to retrieve auth token.');
        }
      } else {
        setAuthStep('register');
      }
    } catch (err: any) {
      console.error('Post-auth setup failed:', err);
      Alert.alert('CONNECTION ERROR', 'Failed to verify agent signature.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('DECRYPTION FAILURE', 'Invalid communication frequency (email).');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setActiveProvider('email');
    try {
      await client.auth.email.sendOTP(email.trim());
      setAuthStep('decryptor');
      setResendCountdown(60);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.error('Failed to send OTP:', err);
      Alert.alert('TRANSMISSION FAILURE', err.message || 'Failed to send OTP code.');
    } finally {
      setIsLoading(false);
      setActiveProvider(null);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newOtp = [...otp];
    newOtp[index] = text.slice(-1);
    setOtp(newOtp);

    if (text && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
    
    if (newOtp.every(val => val !== '') && index === 5) {
      triggerOtpVerify(newOtp.join(''));
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      otpInputs.current[index - 1]?.focus();
    }
  };

  const triggerOtpVerify = async (code: string) => {
    setIsLoading(true);
    setActiveProvider('email');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await client.auth.email.verifyOTP(code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.error('Failed to verify OTP:', err);
      Alert.alert('DECRYPTION FAILURE', err.message || 'Invalid security key.');
    } finally {
      setIsLoading(false);
      setActiveProvider(null);
    }
  };

  const handleAgentRegistration = async () => {
    if (username.trim().length < 3) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('ACCESS DENIED', 'Agent codename must be at least 3 characters.');
      return;
    }

    const address = client.wallets.primary?.address;
    if (!address) {
      Alert.alert('ACCESS DENIED', 'No active wallet link established.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsLoading(true);
    try {
      const registerResponse = await fetch(`${BACKEND_URL}/api/player`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          username: username.trim(),
          email: client.auth.authenticatedUser?.email || email || undefined,
          referredBy: referralCode.trim() || undefined,
        }),
      });
      const registerData = await registerResponse.json();

      if (registerResponse.status === 400 && registerData.error === 'USERNAME_TAKEN') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('CODENAME COLLISION', 'This agent codename has already been claimed.');
        return;
      }

      if (!registerResponse.ok || !registerData.token) {
        throw new Error(registerData.message || 'Server rejected registration.');
      }

      await AsyncStorage.setItem('onboarding_completed', 'true');
      await AsyncStorage.setItem('jwt_token', registerData.token);
      await AsyncStorage.setItem('registered_username', registerData.player.username);
      await AsyncStorage.setItem('registered_avatar_color', AVATARS[selectedAvatar].color);
      await AsyncStorage.setItem('registered_avatar_name', AVATARS[selectedAvatar].name);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/game');
    } catch (err: any) {
      console.error('Registration failed:', err);
      Alert.alert('SYSTEM ERROR', err.message || 'Failed to register agent. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setActiveProvider(provider);
    try {
      await client.auth.social.connect({ provider });
    } catch (err: any) {
      console.error(`Social auth failed for ${provider}:`, err);
      Alert.alert('AUTHORIZATION FAILURE', err.message || 'Failed to authenticate.');
    } finally {
      setIsLoading(false);
      setActiveProvider(null);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setActiveProvider('email');
    try {
      await client.auth.email.resendOTP();
      setResendCountdown(60);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('TRANSMISSION SUCCESS', 'A new access key has been transmitted.');
    } catch (err: any) {
      console.error('Failed to resend OTP:', err);
      Alert.alert('TRANSMISSION FAILURE', err.message || 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
      setActiveProvider(null);
    }
  };

  // TODO: Enable when native build + domain setup is complete
  const PASSKEY_ENABLED = false;

  const handlePasskeyLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!PASSKEY_ENABLED) {
      Alert.alert('COMING SOON', 'Biometric passkey login will be available in the next update.');
      return;
    }
    setIsLoading(true);
    setActiveProvider('passkey');
    try {
      await client.auth.passkey.signIn();
    } catch (err: any) {
      console.error('Passkey sign-in failed:', err);
      Alert.alert('DECRYPTION FAILURE', err.message || 'Passkey auth failed.');
    } finally {
      setIsLoading(false);
      setActiveProvider(null);
    }
  };

  return {
    client,
    authStep,
    setAuthStep,
    email,
    setEmail,
    otp,
    setOtp,
    username,
    setUsername,
    referralCode,
    setReferralCode,
    selectedAvatar,
    setSelectedAvatar,
    isLoading,
    activeProvider,
    cursorVisible,
    otpInputs,
    handleEmailSubmit,
    handleOtpChange,
    handleOtpKeyPress,
    handleAgentRegistration,
    handleSocialLogin,
    handleResendOtp,
    handlePasskeyLogin,
    resendCountdown,
  };
};
export { AVATARS };

