import { create } from 'zustand';

interface WsState {
  isConnected: boolean;
  lastReconnect: number | null;
  setConnected: (value: boolean) => void;
  notifyReconnect: () => void;
}

export const useWsStore = create<WsState>((set) => ({
  isConnected: false,
  lastReconnect: null,
  setConnected: (value) => set({ isConnected: value }),
  notifyReconnect: () => set({ lastReconnect: Date.now() }),
}));
