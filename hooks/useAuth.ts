import { client } from '@/thirdwebClient'
import { useCallback, useState } from 'react'
import { celo } from 'thirdweb/chains'
import { useActiveAccount, useConnect } from 'thirdweb/react-native'
import { inAppWallet, preAuthenticate } from 'thirdweb/wallets/in-app'

export interface AuthError {
  code: string
  message: string
  details?: any
}

export interface AuthState {
  isLoading: boolean
  error: AuthError | null
  isConnected: boolean
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: false,
    error: null,
    isConnected: false
  })

  const account = useActiveAccount()
  const { connect, isConnecting } = useConnect()

  const wallet = inAppWallet({
    auth: {
      options: ['google','apple', 'email'],
    },
    executionMode: {
      mode: 'EIP7702',
      sponsorGas: true,
    },
  })

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }))
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setAuthState(prev => ({ ...prev, isLoading: loading }))
  }, [])

  const setError = useCallback((error: AuthError) => {
    console.log('Setting error:', error)
    setAuthState(prev => ({ ...prev, error, isLoading: false }))
  }, [])

  const handleAuthSuccess = useCallback(() => {
    setAuthState(prev => ({ ...prev, isLoading: false, error: null, isConnected: true }))
  }, [])

  return {
    ...authState,
    account,
    wallet,
    connect,
    isConnecting: isConnecting || authState.isLoading,
    clearError,
    setLoading,
    setError,
    handleAuthSuccess
  }
}

// ==================== GOOGLE AUTH ====================
export const useGoogleAuth = () => {
  const { 
    isLoading, 
    error, 
    isConnected, 
    account, 
    wallet, 
    connect, 
    isConnecting, 
    clearError, 
    setLoading, 
    setError, 
    handleAuthSuccess 
  } = useAuth()

  const loginWithGoogle = useCallback(async () => {
    try {
      setLoading(true)
      clearError()

      console.log('Attempting Google login')

      await wallet.connect({
        client,
        chain: celo,
        strategy: "google"
      })
      await connect(wallet)

      console.log('Google login successful')
      handleAuthSuccess()
      setLoading(false)
    } catch (error: any) {
      console.error('Google login failed:', error)
      
      let errorMessage = 'Failed to connect with Google'
      let errorCode = 'GOOGLE_AUTH_ERROR'

      const errorMsg = error?.message?.toLowerCase() || ''

      if (errorMsg.includes('user rejected') || errorMsg.includes('user closed')) {
        errorMessage = 'Authentication was cancelled'
        errorCode = 'USER_CANCELLED'
      } else if (errorMsg.includes('network') || errorMsg.includes('failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again'
        errorCode = 'NETWORK_ERROR'
      } else if (errorMsg.includes('rate limit')) {
        errorMessage = 'Too many attempts. Please wait a moment and try again'
        errorCode = 'RATE_LIMITED'
      }

      const authError: AuthError = {
        code: errorCode,
        message: errorMessage,
        details: error
      }
      
      console.log('Setting auth error:', authError)
      setError(authError)
      setLoading(false)
    }
  }, [setLoading, clearError, connect, wallet, handleAuthSuccess, setError])

  return {
    isLoading,
    error,
    isConnected,
    account,
    wallet,
    connect,
    isConnecting,
    clearError,
    setLoading,
    setError,
    handleAuthSuccess,
    loginWithGoogle
  }
}

// ==================== APPLE AUTH ====================
export const useAppleAuth = () => {
  const { 
    isLoading, 
    error, 
    isConnected, 
    account, 
    wallet, 
    connect, 
    isConnecting, 
    clearError, 
    setLoading, 
    setError, 
    handleAuthSuccess 
  } = useAuth()

  const loginWithApple = useCallback(async () => {
    try {
      setLoading(true)
      clearError()

      console.log('Attempting Apple login')

      await wallet.connect({
        client,
        chain: celo,
        strategy: "apple"
      })
      await connect(wallet)

      console.log('Apple login successful')
      handleAuthSuccess()
      setLoading(false)
    } catch (error: any) {
      console.error('Apple login failed:', error)
      
      let errorMessage = 'Failed to connect with Apple'
      let errorCode = 'APPLE_AUTH_ERROR'

      const errorMsg = error?.message?.toLowerCase() || ''

      if (errorMsg.includes('user rejected') || errorMsg.includes('user closed')) {
        errorMessage = 'Authentication was cancelled'
        errorCode = 'USER_CANCELLED'
      } else if (errorMsg.includes('network') || errorMsg.includes('failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again'
        errorCode = 'NETWORK_ERROR'
      } else if (errorMsg.includes('rate limit')) {
        errorMessage = 'Too many attempts. Please wait a moment and try again'
        errorCode = 'RATE_LIMITED'
      }

      const authError: AuthError = {
        code: errorCode,
        message: errorMessage,
        details: error
      }
      
      console.log('Setting auth error:', authError)
      setError(authError)
      setLoading(false)
    }
  }, [setLoading, clearError, connect, wallet, handleAuthSuccess, setError])

  return {
    isLoading,
    error,
    isConnected,
    account,
    wallet,
    connect,
    isConnecting,
    clearError,
    setLoading,
    setError,
    handleAuthSuccess,
    loginWithApple
  }
}

// ==================== EMAIL AUTH ====================
export interface UseEmailAuthReturn {
  isLoading: boolean
  error: AuthError | null
  isConnected: boolean
  account: any
  wallet: any
  connect: any
  isConnecting: boolean
  emailSent: boolean
  clearError: () => void
  setLoading: (loading: boolean) => void
  setError: (error: AuthError) => void
  handleAuthSuccess: () => void
  loginWithEmail: (email: string, verificationCode: string) => Promise<boolean>
  sendEmailCode: (email: string) => Promise<boolean>
  resetEmailFlow: () => void
}

export const useEmailAuth = (): UseEmailAuthReturn => {
  const { 
    isLoading, 
    error, 
    isConnected, 
    account, 
    wallet, 
    connect, 
    isConnecting, 
    clearError, 
    setLoading, 
    setError, 
    handleAuthSuccess 
  } = useAuth()
  
  const [emailSent, setEmailSent] = useState(false)

  const resetEmailFlow = useCallback(() => {
    setEmailSent(false)
    clearError()
  }, [clearError])

  const sendEmailCode = useCallback(async (email: string): Promise<boolean> => {
    try {
      setLoading(true)
      clearError()

      console.log('Sending email code to:', email)

      await preAuthenticate({
        client,
        strategy: "email",
        email: email,
      })
      
      console.log('Email code sent successfully')
      setEmailSent(true)
      setLoading(false)
      return true
    } catch (error: any) {
      console.error('Failed to send email code:', error)
      
      let errorMessage = 'Failed to send verification code'
      let errorCode = 'EMAIL_SEND_ERROR'

      const errorMsg = error?.message?.toLowerCase() || ''

      if (errorMsg.includes('invalid email')) {
        errorMessage = 'Please enter a valid email address'
        errorCode = 'INVALID_EMAIL'
      } else if (errorMsg.includes('rate limit')) {
        errorMessage = 'Too many requests. Please wait a moment and try again'
        errorCode = 'RATE_LIMITED'
      } else if (errorMsg.includes('network') || errorMsg.includes('failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again'
        errorCode = 'NETWORK_ERROR'
      }

      const authError: AuthError = {
        code: errorCode,
        message: errorMessage,
        details: error
      }

      setError(authError)
      setLoading(false)
      return false
    }
  }, [setLoading, clearError, setError])

  const loginWithEmail = useCallback(async (email: string, verificationCode: string): Promise<boolean> => {
    try {
      setLoading(true)
      clearError()

      console.log('Attempting email login with:', email, verificationCode)
      console.log('Code length:', verificationCode.length)
      console.log('Code type:', typeof verificationCode)

      // Validate code is 6 digits
      if (!verificationCode) {
        console.log('No verification code provided')
        const authError: AuthError = {
          code: 'INVALID_CODE',
          message: 'Please enter the verification code.',
        }
        setError(authError)
        setLoading(false)
        return false
      }

      const trimmedCode = verificationCode.trim()
      
      if (trimmedCode.length !== 6) {
        console.log('Invalid code length:', trimmedCode.length)
        const authError: AuthError = {
          code: 'INVALID_CODE',
          message: `Verification code must be 6 digits. You entered ${trimmedCode.length} characters.`,
        }
        setError(authError)
        setLoading(false)
        return false
      }

      if (!/^\d{6}$/.test(trimmedCode)) {
        console.log('Code contains non-digits')
        const authError: AuthError = {
          code: 'INVALID_CODE',
          message: 'Verification code must contain only numbers.',
        }
        setError(authError)
        setLoading(false)
        return false
      }

      console.log('Connecting wallet with code:', trimmedCode)

      await wallet.connect({
        client,
        chain: celo,
        strategy: "email",
        email: email,
        verificationCode: trimmedCode,
      })
      
      await connect(wallet)

      console.log('Email login successful')
      handleAuthSuccess()
      setLoading(false)
      return true
    } catch (error: any) {
      console.error('Email login failed - Full error:', error)
      console.error('Error message:', error?.message)
      console.error('Error code:', error?.code)
      
      let errorMessage = error?.message || 'The verification code you entered is incorrect or has expired. Please try again.'
      let errorCode = 'INVALID_CODE'

      const errorMsg = error?.message?.toLowerCase() || ''

      if (errorMsg.includes('verify') || errorMsg.includes('failed to verify')) {
        errorMessage = 'The verification code is incorrect or has expired. Please request a new code and try again.'
        errorCode = 'INVALID_CODE'
      } else if (errorMsg.includes('network') || errorMsg.includes('failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again'
        errorCode = 'NETWORK_ERROR'
      } else if (errorMsg.includes('rate limit') || errorMsg.includes('too many')) {
        errorMessage = 'Too many attempts. Please wait a few minutes and try again'
        errorCode = 'RATE_LIMITED'
      }

      const authError: AuthError = {
        code: errorCode,
        message: errorMessage,
        details: error
      }

      console.log('Setting auth error:', authError)
      setError(authError)
      setLoading(false)
      return false
    }
  }, [setLoading, clearError, connect, wallet, handleAuthSuccess, setError])

  return {
    isLoading,
    error,
    isConnected,
    account,
    wallet,
    connect,
    isConnecting,
    clearError,
    setLoading,
    setError,
    handleAuthSuccess,
    emailSent,
    sendEmailCode,
    loginWithEmail,
    resetEmailFlow
  }
}