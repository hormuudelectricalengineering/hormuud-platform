import { create } from 'zustand'

interface JobState {
  currentJobId: string | null;
  jobDetails: any | null;
  timerElapsed: number;
  isOnline: boolean;
  offer: any | null;
  setCurrentJob: (jobId: string | null, details?: any) => void;
  setTimerElapsed: (seconds: number) => void;
  completeJob: () => void;
  toggleOnline: (status?: boolean) => void;
  setOffer: (offer: any) => void;
}

export const useJobStore = create<JobState>((set) => ({
  currentJobId: null,
  jobDetails: null,
  timerElapsed: 0,
  isOnline: false,
  offer: null,
  setCurrentJob: (jobId, details = null) => set({ currentJobId: jobId, jobDetails: details }),
  setTimerElapsed: (seconds) => set({ timerElapsed: seconds }),
  completeJob: () => set({ currentJobId: null, jobDetails: null, timerElapsed: 0 }),
  toggleOnline: (status) => set((state) => ({ isOnline: status ?? !state.isOnline })),
  setOffer: (offer) => set({ offer }),
}))