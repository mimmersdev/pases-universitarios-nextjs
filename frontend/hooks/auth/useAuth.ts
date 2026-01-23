import { create } from "zustand";
import { User } from "pases-universitarios";

interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;

    logout: () => void;
    setUser: (user: User) => void;
    setToken: (token: string | null) => void;
    setLoading: (state: boolean) => void;
}

export const useAuth = create<AuthState>((set) => ({
    user: null,
    token: null,
    loading: false,

    setUser: (user: User) => set({ user }),

    setToken: (token: string | null) => {
        set({ token });
    },

    setLoading: (state: boolean) => set({ loading: state }),

    logout: () => {
        set({ user: null, token: null });
    },
}));
