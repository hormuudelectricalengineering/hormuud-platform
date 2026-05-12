import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AuthState {
  token: string | null;
  user: any | null;
  engineerId: string | null;
  isOnline: boolean;
  phone: string | null;
  setToken: (token: string) => void;
  setUser: (user: any) => void;
  setEngineer: (engineer: any) => void;
  setPhone: (phone: string) => void;
  toggleOnline: (status?: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      engineerId: null,
      isOnline: false,
      phone: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setEngineer: (engineer) => set({ engineerId: engineer?.id }),
      setPhone: (phone) => set({ phone }),
      toggleOnline: (status) => set((state) => ({ isOnline: status ?? !state.isOnline })),
      logout: () => set({ token: null, user: null, engineerId: null, isOnline: false }),
    }),
    {
      name: 'auth-storage-engineer',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)