import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


// ==================== EMAIL VERIFICATION MODAL ====================
const EmailVerificationModal: React.FC<{
  email: string;
  onVerify: (code: string) => Promise<void>;
  onBack: () => void;
  onResend: () => Promise<void>;
  isLoading: boolean;
}> = ({ email, onVerify, onBack, onResend, isLoading }) => {
  const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeInputRefs = useRef<Array<TextInput | null>>([null, null, null, null, null, null]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...codeDigits];
    next[index] = value;
    setCodeDigits(next);

    if (value && index < codeInputRefs.current.length - 1) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number) => {
    if (codeDigits[index] === '' && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = codeDigits.join('');
    if (code.length === 6) {
      await onVerify(code);
    }
  };

  const handleResend = async () => {
    if (resendCooldown === 0) {
      await onResend();
      setResendCooldown(60);
    }
  };

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const verificationCode = codeDigits.join('');

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16 }}>
          <View className="items-center">
            {/* Back Button */}
            <TouchableOpacity
              onPress={onBack}
              disabled={isLoading}
              className="mb-6 self-start flex-row items-center gap-2"
            >
              <Text className="font-terminal text-sm text-secondary">←</Text>
              <Text className="font-terminal text-sm text-secondary">Back</Text>
            </TouchableOpacity>

            {/* Header */}
            <View className="mb-8 items-center">
            <Text
              className="mb-4 text-base font-arcade text-secondary"
              style={{ textShadowColor: "#00FFFF", textShadowRadius: 10 }}
            >
              VERIFY YOUR EMAIL
            </Text>
              <Text className="font-pixel_regular text-sm text-grey text-center">
                ENTER THE 6 DIGIT CODE SENT TO{'\n'}
                <Text className="text-warning font-pixel_semibold">{email}</Text>
              </Text>
            </View>

            {/* Code Input Fields */}
            <View className="w-full mb-6 flex-row justify-between gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <TextInput
                  key={i}
                  ref={(ref) => {
                    codeInputRefs.current[i] = ref;
                  }}
                  value={codeDigits[i]}
                  onChangeText={(value) => handleCodeChange(i, value)}
                  onKeyPress={() => handleCodeKeyDown(i)}
                  placeholder="0"
                  placeholderTextColor="#808080"
                  keyboardType="number-pad"
                  maxLength={1}
                  editable={!isLoading}
                  className="flex-1 h-20 text-center font-pixel_bold text-2xl border-2 border-secondary rounded-lg bg-grey-200 text-white"
                />
              ))}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              onPress={handleVerify}
              disabled={verificationCode.length !== 6 || isLoading}
              className={`w-full rounded py-3 items-center mb-4 ${
                verificationCode.length === 6 ? 'bg-secondary' : 'bg-grey'
              }`}
              style={{
                opacity: isLoading ? 0.6 : 1,
                shadowColor: verificationCode.length === 6 ? '#00FFFF' : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: verificationCode.length === 6 ? 0.8 : 0,
                shadowRadius: 10,
                elevation: verificationCode.length === 6 ? 8 : 0,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="primary" size="small" />
              ) : (
                <Text className={`font-pixel_bold text-sm ${
                  verificationCode.length === 6 ? 'text-primary' : 'text-grey-100'
                }`}>
                  VERIFY CODE
                </Text>
              )}
            </TouchableOpacity>

            {/* Resend Button */}
            <TouchableOpacity
              onPress={handleResend}
              disabled={isLoading || resendCooldown > 0}
              className="py-2"
            >
              <Text
                className={`font-pixel_regular text-sm font-semibold ${
                  resendCooldown > 0 ? 'text-grey' : 'text-accent'
                }`}
              >
                {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
              </Text>
            </TouchableOpacity>

            {/* Info Box */}
            <View className="mt-6 w-full border-2 border-secondary rounded-lg bg-grey-200 p-4">
              <Text className="font-pixel_medium text-xs font-semibold text-secondary mb-1">
                ⏱️ CODE VALIDITY
              </Text>
              <Text className="font-pixel_regular text-xs text-grey">
                YOUR VERIFICATION CODE IS VALID FOR 10 MINUTES. IF IT EXPIRES, REQUEST A NEW ONE.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};


export default EmailVerificationModal;