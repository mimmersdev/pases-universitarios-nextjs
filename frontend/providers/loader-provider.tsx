"use client";

import { create } from "zustand";

interface LoaderState {
    isLoading: boolean;
    setLoading: (state: boolean) => void;
}

export const useLoader = create<LoaderState>((set) => ({
    isLoading: true,
    setLoading: (state: boolean) => set({ isLoading: state }),
}));
