import { create } from 'zustand';

type PaymentStatus = 'idle' | 'loading' | 'redirecting' | 'error';

interface PaymentState {
  status: PaymentStatus;
  preferenceId: string | null;
  error: string | null;
  setStatus: (status: PaymentStatus) => void;
  setPreferenceId: (id: string) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  status: 'idle',
  preferenceId: null,
  error: null,
  setStatus: (status) => set({ status }),
  setPreferenceId: (id) => set({ preferenceId: id }),
  setError: (error) => set({ error }),
  reset: () => set({ status: 'idle', preferenceId: null, error: null }),
}));
