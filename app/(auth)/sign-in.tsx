import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const AVATARS = [
  { name: 'CYAN VIPER', color: '#00FFFF', glowClass: 'text-secondary', speed: 85, size: 45, glow: 95 },
  { name: 'LIME PYTHON', color: '#00FF00', glowClass: 'text-accent', speed: 65, size: 85, glow: 55 },
  { name: 'GOLDEN COBRA', color: '#FFD700', glowClass: 'text-reward', speed: 95, size: 55, glow: 85 },
  { name: 'RED ANACONDA', color: '#FF0000', glowClass: 'text-destructive', speed: 75, size: 75, glow: 65 },
];

export default function SignIn() {
  const router = useRouter();
  const [authStep, setAuthStep] = useState<'login' | 'decryptor' | 'register'>('login');
  
  // Input fields
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [username, setUsername] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Focus reference for OTP boxes
  const otpInputs = useRef<Array<TextInput | null>>([]);

  // Blink cursor for terminal inputs
  const [cursorVisible, setCursorVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 550);
    return () => clearInterval(interval);
  }, []);

  // CRT scan line sweep shared value
  const scanBarY = useSharedValue(-50);
  useEffect(() => {
    scanBarY.value = withRepeat(
      withTiming(SCREEN_HEIGHT + 50, {
        duration: 4000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const scanBarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanBarY.value }],
  }));

  // Handle email submission -> go to decryptor
  const handleEmailSubmit = () => {
    if (!email.trim() || !email.includes('@')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('DECRYPTION FAILURE', 'Invalid communication frequency (email).');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setAuthStep('decryptor');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1500);
  };

  // Handle OTP inputs
  const handleOtpChange = (text: string, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newOtp = [...otp];
    newOtp[index] = text.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
    
    // If last digit entered, trigger auto-submit
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

  const triggerOtpVerify = (code: string) => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => {
      setIsLoading(false);
      setAuthStep('register');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1800);
  };

  // Handle character creation & onboarding save
  const handleAgentRegistration = async () => {
    if (username.trim().length < 3) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('ACCESS DENIED', 'Agent codename must be at least 3 characters.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsLoading(true);
    try {
      // Save stats to local storage for design demo
      await AsyncStorage.setItem('onboarding_completed', 'true');
      await AsyncStorage.setItem('registered_username', username.trim());
      await AsyncStorage.setItem('registered_avatar_color', AVATARS[selectedAvatar].color);
      await AsyncStorage.setItem('registered_avatar_name', AVATARS[selectedAvatar].name);
      
      setTimeout(() => {
        setIsLoading(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Clear stack and navigate to game
        router.replace('/(tabs)/game');
      }, 1500);
    } catch (err) {
      setIsLoading(false);
      Alert.alert('SYSTEM ERROR', 'Failed to register agent. Try again.');
    }
  };

  // Mock social login triggers
  const handleSocialLogin = (provider: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setAuthStep('register');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1500);
  };

  // RENDER 1: SOCIAL/EMAIL LOGIN
  const renderLogin = () => (
    <Animated.View entering={FadeIn.duration(400)} className="w-full">
      <Text className="font-arcade text-xs text-secondary text-center mb-2 tracking-widest">
        // PROTOCOL_AUTH //
      </Text>
      <Text 
        className="font-arcade text-[15px] text-white text-center mb-8 tracking-wider"
        style={{
          textShadowColor: '#00FFFF',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 6,
        }}
      >
        SECURE LOGIN
      </Text>

      {/* Social login grid */}
      <View className="w-full gap-3 mb-6">
        <TouchableOpacity
          onPress={() => handleSocialLogin('Google')}
          disabled={isLoading}
          activeOpacity={0.85}
          className="w-full border-2 border-white rounded-xl py-4 bg-white/5 flex-row justify-center items-center gap-3"
        >
          <FontAwesome name="google" size={20} color="white" />
          <Text className="font-pixel_bold text-white text-sm tracking-wider">
            AUTHORIZE WITH GOOGLE
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleSocialLogin('Apple')}
          disabled={isLoading}
          activeOpacity={0.85}
          className="w-full border-2 border-grey-100 rounded-xl py-4 bg-[#1c2242] flex-row justify-center items-center gap-3"
        >
          <FontAwesome name="apple" size={20} color="white" />
          <Text className="font-pixel_bold text-white text-sm tracking-wider">
            AUTHORIZE WITH APPLE
          </Text>
        </TouchableOpacity>
      </View>

      {/* Retro Divider */}
      <View className="flex-row items-center justify-center my-6">
        <View className="flex-1 h-[2px] bg-grey-200" />
        <Text className="font-arcade text-[10px] text-grey-DEFAULT px-4 tracking-widest">
          OR
        </Text>
        <View className="flex-1 h-[2px] bg-grey-200" />
      </View>

      {/* Email Terminal Input */}
      <View className="w-full border-2 border-secondary/40 rounded-xl bg-[#101432] p-4 mb-4">
        <Text className="font-terminal text-xs text-secondary mb-2 tracking-wider">
          ESTABLISH TERMINAL LINK (EMAIL):
        </Text>
        <View className="flex-row items-center bg-[#07091a] border border-secondary/30 rounded px-3 py-2 mb-3">
          <Ionicons name="mail-outline" size={18} color="#00FFFF" style={{ marginRight: 8 }} />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="your_comms_link@email.com"
            placeholderTextColor="#404040"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
            className="flex-1 font-terminal text-[15px] text-white py-1"
          />
        </View>

        <TouchableOpacity
          onPress={handleEmailSubmit}
          disabled={!email || isLoading}
          activeOpacity={0.8}
          className={`w-full py-3.5 rounded-lg items-center ${
            !email ? 'bg-grey-200 border border-grey-DEFAULT/30' : 'bg-secondary'
          }`}
          style={email ? {
            shadowColor: '#00FFFF',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 8,
            elevation: 5
          } : {}}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#0A0E27" />
          ) : (
            <Text className={`font-pixel_bold text-sm tracking-wider ${!email ? 'text-grey-DEFAULT' : 'text-primary'}`}>
              TRANSMIT OTP LINK
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Text className="font-pixel_regular text-white text-[10px] text-grey-DEFAULT text-center leading-relaxed mt-4 px-2">
        Zero setup needed. Sign in and start playing in seconds. Your rewards are always yours.
      </Text>
    </Animated.View>
  );

  // RENDER 2: ACCESS DECRYPTOR (OTP PIN)
  const renderDecryptor = () => (
    <Animated.View entering={FadeIn.duration(400)} className="w-full">
      <TouchableOpacity 
        onPress={() => setAuthStep('login')}
        className="flex-row items-center mb-6 self-start"
      >
        <Ionicons name="arrow-back-outline" size={16} color="#00FFFF" />
        <Text className="font-pixel_semibold text-xs text-secondary ml-1.5 tracking-wider">
          CANCEL LINK
        </Text>
      </TouchableOpacity>

      <Text className="font-arcade text-xs text-warning text-center mb-2 tracking-widest">
        // ACCESS_DECRYPTOR //
      </Text>
      <Text 
        className="font-arcade text-[14px] text-white text-center mb-3 tracking-wider"
        style={{
          textShadowColor: '#FFFF00',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 6,
        }}
      >
        ENTER SECURITY KEY
      </Text>
      <Text className="font-pixel_regular text-xs text-grey-100 text-center mb-8 px-4 leading-relaxed">
        We sent an authorization transmission code to:{"\n"}
        <Text className="text-secondary font-pixel_semibold">{email}</Text>
      </Text>

      {/* OTP Boxes Grid */}
      <View className="flex-row justify-center gap-2 mb-8">
        {otp.map((digit, idx) => (
          <View
            key={idx}
            className="w-11 h-14 rounded-lg bg-[#101432] justify-center items-center relative"
            style={{
              borderWidth: 2,
              borderColor: digit ? '#00FF00' : '#404040',
              shadowColor: digit ? '#00FF00' : 'transparent',
              shadowOpacity: digit ? 0.3 : 0,
              shadowRadius: 5,
            }}
          >
            <TextInput
              ref={(ref) => { otpInputs.current[idx] = ref; }}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, idx)}
              onKeyPress={(e) => handleOtpKeyPress(e, idx)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              className="w-full h-full text-center font-arcade text-lg text-white"
              style={{ paddingBottom: Platform.OS === 'android' ? 2 : 0 }}
            />
            {!digit && idx === otp.findIndex(v => v === '') && cursorVisible && (
              <View className="absolute bottom-2 w-3.5 h-[3px] bg-secondary" />
            )}
          </View>
        ))}
      </View>

      {/* Verification status */}
      <View className="items-center mb-6 min-h-[40px]">
        {isLoading ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator size="small" color="#FFFF00" />
            <Text className="font-terminal text-sm text-warning tracking-widest">
              DECRYPTING SECTOR SIGNAL...
            </Text>
          </View>
        ) : (
          <TouchableOpacity 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert('TRANSMISSION SENT', 'A new decryptor key has been sent to your email.');
            }}
          >
            <Text className="font-pixel_semibold text-xs text-warning tracking-widest underline decoration-warning">
              RESEND ACCESS KEY
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  // RENDER 3: RPG CHARACTER CREATION
  const renderRegister = () => {
    const avatar = AVATARS[selectedAvatar];
    return (
      <Animated.View entering={FadeIn.duration(400)} className="w-full">
        <Text className="font-arcade text-xs text-accent text-center mb-2 tracking-widest">
          // CODENAME_REGISTRATION //
        </Text>
        <Text 
          className="font-arcade text-[14px] text-white text-center mb-6 tracking-wider"
          style={{
            textShadowColor: '#00FF00',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 6,
          }}
        >
          INITIALIZE AGENT
        </Text>

        {/* Character Card Box */}
        <View className="w-full border-2 border-accent/40 rounded-xl bg-[#101432] p-4 mb-4">
          <Text className="font-terminal text-xs text-accent mb-2 tracking-wider">
            ASSIGN AGENT CODENAME (USERNAME):
          </Text>
          <View className="flex-row items-center bg-[#07091a] border border-accent/30 rounded px-3 py-2 mb-3">
            <Ionicons name="terminal-outline" size={18} color="#00FF00" style={{ marginRight: 8 }} />
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Min 3 chars..."
              placeholderTextColor="#404040"
              maxLength={20}
              autoCapitalize="none"
              editable={!isLoading}
              className="flex-1 font-terminal text-[15px] text-white py-1"
            />
            {username.length > 0 && cursorVisible && (
              <View className="w-2.5 h-[15px] bg-[#00FF00] ml-1" />
            )}
          </View>
          <Text className="text-[10px] font-terminal text-grey-DEFAULT text-right mb-2">
            LENGTH: {username.length}/20
          </Text>

          {/* Avatar grid selection */}
          <Text className="font-terminal text-xs text-accent mb-2.5 tracking-wider">
            SELECT SNAKE SUB-SYSTEM AVATAR:
          </Text>
          <View className="flex-row justify-between mb-4">
            {AVATARS.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedAvatar(idx);
                }}
                activeOpacity={0.8}
                className="w-[22%] aspect-square rounded-xl justify-center items-center border-2 bg-[#07091a]"
                style={{
                  borderColor: selectedAvatar === idx ? item.color : '#2d3356',
                  shadowColor: selectedAvatar === idx ? item.color : 'transparent',
                  shadowOpacity: selectedAvatar === idx ? 0.8 : 0,
                  shadowRadius: 5,
                }}
              >
                {/* Visual Avatar block */}
                <View 
                  className="w-6 h-6 rounded"
                  style={{
                    backgroundColor: item.color,
                    shadowColor: item.color,
                    shadowOpacity: 0.9,
                    shadowRadius: 5,
                  }}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Dynamic Stat Screen */}
          <View className="bg-[#07091a] rounded-lg p-3.5 border border-[#2d3356] mb-2">
            <Text className={`font-arcade text-[10px] mb-3 tracking-wider ${avatar.glowClass}`}>
              SYS: {avatar.name}
            </Text>

            {/* Stat Row 1: SPEED */}
            <View className="mb-2">
              <View className="flex-row justify-between mb-1">
                <Text className="font-pixel text-[10px] text-grey-DEFAULT">SPEED ENGINE</Text>
                <Text className="font-terminal text-xs text-white">{avatar.speed}%</Text>
              </View>
              <View className="h-[6px] bg-grey-200 rounded overflow-hidden">
                <View className="h-full bg-secondary" style={{ width: `${avatar.speed}%` }} />
              </View>
            </View>

            {/* Stat Row 2: TAIL CAPACITY */}
            <View className="mb-2">
              <View className="flex-row justify-between mb-1">
                <Text className="font-pixel text-[10px] text-grey-DEFAULT">SIZE POTENTIAL</Text>
                <Text className="font-terminal text-xs text-white">{avatar.size}%</Text>
              </View>
              <View className="h-[6px] bg-grey-200 rounded overflow-hidden">
                <View className="h-full bg-accent" style={{ width: `${avatar.size}%` }} />
              </View>
            </View>

            {/* Stat Row 3: GLOW RESONANCE */}
            <View>
              <View className="flex-row justify-between mb-1">
                <Text className="font-pixel text-[10px] text-grey-DEFAULT">GLOW RESONANCE</Text>
                <Text className="font-terminal text-xs text-white">{avatar.glow}%</Text>
              </View>
              <View className="h-[6px] bg-grey-200 rounded overflow-hidden">
                <View className="h-full bg-reward" style={{ width: `${avatar.glow}%` }} />
              </View>
            </View>
          </View>
        </View>

        {/* Optional Referral */}
        <View className="w-full border border-purple-400/35 rounded-xl bg-[#101432] p-4 mb-5">
          <Text className="font-terminal text-xs text-purple-400 mb-2 tracking-wider">
            REFERRAL PROTOCOL LINK (OPTIONAL):
          </Text>
          <View className="flex-row items-center bg-[#07091a] border border-purple-400/30 rounded px-3 py-1.5">
            <Ionicons name="gift-outline" size={16} color="#A78BFA" style={{ marginRight: 8 }} />
            <TextInput
              value={referralCode}
              onChangeText={setReferralCode}
              placeholder="ENTER REFERRAL KEY"
              placeholderTextColor="#404040"
              autoCapitalize="characters"
              editable={!isLoading}
              className="flex-1 font-terminal text-[14px] text-white py-1"
            />
          </View>
        </View>

        {/* Complete Signup Button */}
        <TouchableOpacity
          onPress={handleAgentRegistration}
          disabled={username.trim().length < 3 || isLoading}
          activeOpacity={0.8}
          className={`w-full py-4 rounded-xl items-center ${
            username.trim().length < 3 ? 'bg-grey-200 border border-grey-DEFAULT/30' : 'bg-accent'
          }`}
          style={username.trim().length >= 3 ? {
            shadowColor: '#00FF00',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.7,
            shadowRadius: 10,
            elevation: 6
          } : {}}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#0A0E27" />
          ) : (
            <Text className={`font-pixel_bold text-sm tracking-widest ${username.trim().length < 3 ? 'text-grey-DEFAULT' : 'text-primary'}`}>
              ACTIVATE AGENT GRID {'>'}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* CRT SCANLINE SCREEN EFFECTS */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Subtle grid scanlines */}
        <View style={styles.scanlineOverlay}>
          {Array.from({ length: 70 }).map((_, i) => (
            <View key={i} style={styles.scanline} />
          ))}
        </View>
        
        {/* Animated Sweep Line */}
        <Animated.View style={[scanBarAnimatedStyle, styles.scanBar]} />
        
        {/* Screen Bezel shadow */}
        <View style={styles.bezelShadow} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingVertical: 16
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center py-6 w-full max-w-sm self-center">
            {/* Steps Rendering */}
            {authStep === 'login' && renderLogin()}
            {authStep === 'decryptor' && renderDecryptor()}
            {authStep === 'register' && renderRegister()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
  },
  scanlineOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
    backgroundColor: 'transparent',
  },
  scanline: {
    height: 1.5,
    backgroundColor: '#000000',
    marginTop: 5,
  },
  scanBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#00FFFF',
    opacity: 0.06,
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  bezelShadow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 10,
    borderColor: '#0A0E27',
    opacity: 0.9,
  },
});
