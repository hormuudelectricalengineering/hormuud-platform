import { create } from 'zustand'

interface JobState {
  activeJobId: string | null;
  jobStatus: string;
  engineerLocation: { lat: number; lng: number } | null;
  assignedEngineerId: string | null;
  setActiveJob: (jobId: string | null, status?: string) => void;
  setEngineerLocation: (lat: number, lng: number) => void;
  setAssignedEngineerId: (id: string) => void;
}

export const useJobStore = create<JobState>((set) => ({
  activeJobId: null,
  jobStatus: 'pending',
  engineerLocation: null,
  assignedEngineerId: null,
  setActiveJob: (jobId, status = 'pending') => set({ activeJobId: jobId, jobStatus: status }),
  setEngineerLocation: (lat, lng) => set({ engineerLocation: { lat, lng } }),
  setAssignedEngineerId: (id) => set({ assignedEngineerId: id }),
}))