import { create } from 'zustand';

interface AuthState {
    userId: number | null;
    githubLinked: boolean;
    giteeLinked: boolean;
    setUserId: (id: number) => void;
    setLinked: (github: boolean, gitee: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    userId: 1, // Mocking user 1 for MVP
    githubLinked: false,
    giteeLinked: false,
    setUserId: (id) => set({ userId: id }),
    setLinked: (github, gitee) => set({ githubLinked: github, giteeLinked: gitee }),
    logout: () => set({ userId: null, githubLinked: false, giteeLinked: false }),
}));
