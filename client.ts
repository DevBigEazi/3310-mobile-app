import { createThirdwebClient } from "thirdweb";

export const client = createThirdwebClient({
  clientId: process.env.EXPO_PUBLIC_THIRDWEB_CLIENT_ID as string,
});
