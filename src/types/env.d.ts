declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_BASE_URL: string;
      EXPO_PUBLIC_LUNA_BASE_URL: string;
      EXPO_PUBLIC_USE_MOCKS: string;
      EXPO_PUBLIC_LUNA_API_KEY: string;
    }
  }
}
export {};
