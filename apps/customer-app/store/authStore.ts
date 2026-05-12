import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AuthState {
  token: string | null;
  user: any | null;
  phone: string | null;
  setToken: (token: string) => void;
  setUser: (user: any) => void;
  setPhone: (phone: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      phone: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setPhone: (phone) => set({ phone }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-storage-customer',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)