import { create } from "zustand";

interface AudioState {
  isPlaying: boolean;
  currentWord: string | null;
  play: (word: string) => void;
  stop: () => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  isPlaying: false,
  currentWord: null,

  play: (word) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
    set({ isPlaying: true, currentWord: word });
    utterance.onend = () => set({ isPlaying: false, currentWord: null });
    utterance.onerror = () => set({ isPlaying: false, currentWord: null });
  },

  stop: () => {
    speechSynthesis.cancel();
    set({ isPlaying: false, currentWord: null });
  },
}));
