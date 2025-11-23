// polyfills.ts - Initialize all required polyfills for React Native
import 'react-native-get-random-values';

// Ensure global crypto is available
if (!global.crypto) {
  global.crypto = {} as any;
}

// TextEncoder/TextDecoder polyfill if needed
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Ensure fetch is available (usually built-in to React Native)
if (typeof global.fetch === 'undefined') {
  // Most React Native environments have fetch built-in
}

export {};