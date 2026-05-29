import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, ActivityIndicator, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

// Subcomponents & Hook
import RetroCrtEffects from '../../components/auth/RetroCrtEffects';
import LoginStep from '../../components/auth/LoginStep';
import DecryptorStep from '../../components/auth/DecryptorStep';
import RegisterStep from '../../components/auth/RegisterStep';
import { useSignIn } from '../../hooks/useSignIn';
import { AVATARS } from '../../constants/config';

export default function SignIn(): React.JSX.Element {
  const {
    client,
    authStep,
    setAuthStep,
    email,
    setEmail,
    otp,
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
  } = useSignIn();

  return (
    <SafeAreaView style={styles.container}>
      <RetroCrtEffects />

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
            {!!client.auth.authenticatedUser && (!client.wallets.primary?.address || isLoading) ? (
              <Animated.View entering={FadeIn.duration(400)} className="w-full items-center py-12 bg-[#101432]/40 border-2 border-secondary/30 rounded-2xl p-6 shadow-2xl shadow-secondary/20">
                <ActivityIndicator size="large" color="#00FFFF" />
                <Text 
                  className="font-arcade text-xs text-secondary mt-8 text-center tracking-widest"
                  style={{
                    textShadowColor: '#00FFFF',
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 6,
                    opacity: cursorVisible ? 1 : 0.4,
                  }}
                >
                  SYS: CONNECTING TO EMISSION GRID...
                </Text>
                <Text className="font-terminal text-grey-100 mt-3 text-center text-[10px] tracking-wider leading-relaxed">
                  DECRYPTING PLAYER PROTOCOLS & WALLET KEYS
                </Text>
              </Animated.View>
            ) : (
              <>
                {authStep === 'login' && (
                  <LoginStep
                    email={email}
                    setEmail={setEmail}
                    isLoading={isLoading}
                    activeProvider={activeProvider}
                    onSubmitEmail={handleEmailSubmit}
                    onSocialLogin={handleSocialLogin}
                    onPasskeyLogin={handlePasskeyLogin}
                  />
                )}
                {authStep === 'decryptor' && (
                  <DecryptorStep
                    email={email}
                    otp={otp}
                    isLoading={isLoading}
                    onCancel={() => setAuthStep('login')}
                    onOtpChange={handleOtpChange}
                    onOtpKeyPress={handleOtpKeyPress}
                    onResendOtp={handleResendOtp}
                    otpInputsRef={otpInputs}
                    cursorVisible={cursorVisible}
                    resendCountdown={resendCountdown}
                  />
                )}
                {authStep === 'register' && (
                  <RegisterStep
                    username={username}
                    setUsername={setUsername}
                    referralCode={referralCode}
                    setReferralCode={setReferralCode}
                    selectedAvatar={selectedAvatar}
                    setSelectedAvatar={setSelectedAvatar}
                    isLoading={isLoading}
                    onSubmit={handleAgentRegistration}
                    avatars={AVATARS}
                    cursorVisible={cursorVisible}
                  />
                )}
              </>
            )}
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
});
