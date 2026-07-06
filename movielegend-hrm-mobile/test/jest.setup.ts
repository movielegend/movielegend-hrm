process.env.EXPO_PUBLIC_API_URL = 'https://api.movielegend.test/api/v1';
process.env.EXPO_PUBLIC_SOCKET_URL = 'https://api.movielegend.test';
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
