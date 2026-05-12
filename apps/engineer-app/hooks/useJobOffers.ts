import { useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import { useAuthStore } from '../store/authStore';
import { useJobStore } from '../store/jobStore';
import { router } from 'expo-router';

export function useJobOffers() {
  const user = useAuthStore(state => state.user);
  const setOffer = useJobStore(state => state.setOffer);

  useEffect(() => {
    if (!user) return;

    let channel: any;

    const setupRealtime = async () => {
      const { data } = await supabase.from('engineers').select('id').eq('user_id', user.id).single();
      const myEngineerId = data?.id;

      if (!myEngineerId) return;

      channel = supabase.channel('job_offers')
        .on('broadcast', { event: 'job-offer' }, (payload) => {
          const offerPayload = payload.payload;
          if (offerPayload.target_engineers?.includes(myEngineerId)) {
             setOffer(offerPayload);
             router.push('/(modals)/job-offer');
          }
        })
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user]);
}
