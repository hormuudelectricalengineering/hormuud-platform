import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client';
import { useAuthStore } from '../store/authStore';

export function useJobUpdates(jobId: string | null) {
  const user = useAuthStore(state => state.user);
  const [engineerId, setEngineerId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('pending');
  const [engineerLocation, setEngineerLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (!user || !jobId) return;

    // Listen to personal customer channel for job assignments/updates
    const channel = supabase.channel(`job_updates_${user.id}`)
      .on('broadcast', { event: 'job-assigned' }, (payload) => {
        if (payload.payload.job_id === jobId) {
          setEngineerId(payload.payload.engineer_id);
          setStatus('assigned');
        }
      })
      .on('broadcast', { event: 'job-status-update' }, (payload) => {
         if (payload.payload.job_id === jobId) {
            setStatus(payload.payload.status);
         }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, jobId]);

  // Listen to engineer location if assigned
  useEffect(() => {
    if (!engineerId) return;
    const locChannel = supabase.channel(`engineer_tracking_${engineerId}`)
      .on('broadcast', { event: 'engineer-location-update' }, (payload) => {
         setEngineerLocation({ lat: payload.payload.lat, lng: payload.payload.lng });
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(locChannel);
    };
  }, [engineerId]);

  return { engineerId, status, engineerLocation };
}
