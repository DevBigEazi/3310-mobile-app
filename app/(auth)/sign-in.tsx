import { API_BASE_URL } from '@/config/api';
import { client } from '@/config/thirdwebClient';
import { useAppleAuth, useEmailAuth, useGoogleAuth } from '@/hooks/useAuth';
import EmailVerificationModal from '@/modals/EmailVerificationModal';
import LoginModal from '@/modals/LoginModal';
import UsernameModal from '@/modals/UsernameModal';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useActiveAccount } from 'thirdweb/react-native';
import { getUserEmail } from "thirdweb/wallets/in-app";

interface ModalState {
  type: 'login' | 'email-verification' | 'username';
  email?: string;
}

const SignIn: React.FC = () => {
  const [modal, setModal] = useState<ModalState>({ type: 'login' });
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  
  // Auth hooks
  const googleAuth = useGoogleAuth();
  const appleAuth = useAppleAuth();
  const emailAuth = useEmailAuth();
  const activeAccount = useActiveAccount();

  // Get first available error
  const currentError = googleAuth.error || appleAuth.error || emailAuth.error;
  const isLoading = googleAuth.isConnecting || appleAuth.isConnecting || emailAuth.isConnecting || loading;

  // Check if user has username on backend
  const checkUsernamExists = async (address: string) => {
    try {
      setCheckingUsername(true);
      const response = await fetch(`${API_BASE_URL}/api/player/${address}`);
      
      if (response.ok) {
        const player = await response.json();
        return !!player.username;
      }
      return false;
    } catch (error: any) {
      Alert.alert('Error', `${error}`);
      return false;
    } finally {
      setCheckingUsername(false);
    }
  };

  // Watch for wallet connection
  useEffect(() => {
    if (activeAccount && modal.type !== 'username') {
      checkUsernamExists(activeAccount.address).then(hasUsername => {
        if (hasUsername) {
          // User already has username, go to home
          router.replace("/(tabs)/game");
        } else {
          // User connected but no username, show username modal
          setModal({ type: 'username' });
        }
      });
    }
  }, [activeAccount, modal.type]);

  // Display error alerts
  useEffect(() => {
    if (currentError) {
      Alert.alert('Error', currentError.message);
      googleAuth.clearError();
      appleAuth.clearError();
      emailAuth.clearError();
    }
  }, [currentError]);

  // ==================== LOGIN MODAL ====================
  const handleGooglePress = async () => {
    try {
      await googleAuth.loginWithGoogle();
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleApplePress = async () => {
    try {
      await appleAuth.loginWithApple();
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleEmailSubmit = async (email: string) => {
    try {
      setLoading(true);
      await emailAuth.sendEmailCode(email);
      setModal({ type: 'email-verification', email });
    } catch (error) {
      // Error already handled in hook
    } finally {
      setLoading(false);
    }
  };

  // ==================== EMAIL VERIFICATION MODAL ====================
  const handleEmailVerify = async (code: string) => {
    try {
      const success = await emailAuth.loginWithEmail(modal.email!, code);
      if (success) {
        // Wait a moment for wallet to be set
        setTimeout(() => {
          setModal({ type: 'username' });
        }, 500);
      }
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleResendCode = async () => {
    try {
      await emailAuth.sendEmailCode(modal.email!);
      Alert.alert('Success', 'Verification code sent to your email');
    } catch (error) {
      // Error already handled in hook
    }
  };

  // ==================== USERNAME MODAL ====================
  const handleUsernameComplete = async (username: string) => {
    if (!activeAccount) {
      Alert.alert('Error', 'Wallet not connected');
      return;
    }

    setLoading(true);
    try {
      const userEmail = await getUserEmail({ client });

      const payload = {
        address: activeAccount.address,
        username,
        email: userEmail || 'unknown',
      };

      const response = await fetch(`${API_BASE_URL}/api/player`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = 'Failed to create player';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      Alert.alert('Success', `Welcome ${username}!`);
      // Use replace to clear the navigation stack
      router.replace("/(tabs)/game");
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete signup');
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER MODALS ====================
  if (modal.type === 'login') {
    return (
      <LoginModal
        onEmailSubmit={handleEmailSubmit}
        onGooglePress={handleGooglePress}
        onApplePress={handleApplePress}
        isLoading={isLoading}
      />
    );
  }

  if (modal.type === 'email-verification' && modal.email) {
    return (
      <EmailVerificationModal
        email={modal.email}
        onVerify={handleEmailVerify}
        onBack={() => {
          emailAuth.resetEmailFlow();
          setModal({ type: 'login' });
        }}
        onResend={handleResendCode}
        isLoading={isLoading}
      />
    );
  }

  if (modal.type === 'username') {
    return (
      <UsernameModal 
        onComplete={handleUsernameComplete} 
        isLoading={isLoading} 
      />
    );
  }

  return null;
};

export default SignIn;