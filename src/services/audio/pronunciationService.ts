const audioCache = new Map<string, HTMLAudioElement>();
const pendingRequests = new Map<string, Promise<HTMLAudioElement | null>>();

interface AudioState {
  isPlaying: boolean;
  isSlowMode: boolean;
  currentWord: string | null;
  rate: number;
  queue: string[];
}

const audioState: AudioState = {
  isPlaying: false,
  isSlowMode: false,
  currentWord: null,
  rate: 1,
  queue: [],
};

let onPlayComplete: (() => void) | null = null;

const stateListeners = new Set<(state: AudioState) => void>();

function notifyListeners() {
  stateListeners.forEach((fn) => fn({ ...audioState }));
}

function getAudioUrl(word: string): string {
  const encoded = encodeURIComponent(word.toLowerCase());
  return `https://dict.youdao.com/dictvoice?audio=${encoded}&type=0`;
}

async function fetchAudio(word: string): Promise<HTMLAudioElement | null> {
  if (audioCache.has(word)) {
    return audioCache.get(word)!;
  }

  if (pendingRequests.has(word)) {
    return pendingRequests.get(word)!;
  }

  const promise = new Promise<HTMLAudioElement | null>((resolve) => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = getAudioUrl(word);

    let settled = false;

    const cleanup = () => {
      audio.removeEventListener("canplaythrough", onCanPlay);
      audio.removeEventListener("error", onError);
      pendingRequests.delete(word);
    };

    const onCanPlay = () => {
      if (settled) return;
      settled = true;
      cleanup();
      audioCache.set(word, audio);
      resolve(audio);
    };

    const onError = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(null);
    };

    audio.addEventListener("canplaythrough", onCanPlay);
    audio.addEventListener("error", onError);
    audio.load();

    setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(null);
    }, 3000);
  });

  pendingRequests.set(word, promise);
  return promise;
}

function handlePlaybackEnd() {
  audioState.isPlaying = false;
  audioState.currentWord = null;
  if (audioState.queue.length > 0) {
    const next = audioState.queue.shift()!;
    notifyListeners();
    playWordInternal(next);
  } else {
    notifyListeners();
    onPlayComplete?.();
  }
}

async function playWordInternal(word: string) {
  const audio = await fetchAudio(word);
  if (audio) {
    const clone = audio.cloneNode() as HTMLAudioElement;
    const rate = audioState.isSlowMode ? 0.5 : audioState.rate;
    clone.playbackRate = rate;
    clone.play().catch(() => {
      playWithWebSpeech(word);
    });

    audioState.isPlaying = true;
    audioState.currentWord = word;
    notifyListeners();

    clone.onended = () => {
      handlePlaybackEnd();
    };
    clone.onerror = () => {
      playWithWebSpeech(word);
    };
  } else {
    playWithWebSpeech(word);
  }
}

let voicesLoaded = false;

function ensureVoicesLoaded(): Promise<void> {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      voicesLoaded = true;
      resolve();
      return;
    }
    speechSynthesis.addEventListener(
      "voiceschanged",
      () => {
        voicesLoaded = true;
        resolve();
      },
      { once: true },
    );
    setTimeout(resolve, 1000);
  });
}

async function playWithWebSpeech(word: string) {
  speechSynthesis.cancel();

  if (!voicesLoaded) {
    await ensureVoicesLoaded();
  }

  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = audioState.isSlowMode ? 0.5 : audioState.rate;

  const voices = speechSynthesis.getVoices();
  const usVoice =
    voices.find((v) => v.lang === "en-US" && !v.localService) ||
    voices.find((v) => v.lang === "en-US");
  if (usVoice) {
    utterance.voice = usVoice;
  }

  speechSynthesis.speak(utterance);
  audioState.isPlaying = true;
  audioState.currentWord = word;
  notifyListeners();

  utterance.onend = () => {
    handlePlaybackEnd();
  };
  utterance.onerror = () => {
    handlePlaybackEnd();
  };
}

export const pronunciationService = {
  getState() {
    return { ...audioState };
  },

  subscribe(listener: (state: AudioState) => void) {
    stateListeners.add(listener);
    return () => {
      stateListeners.delete(listener);
    };
  },

  toggleSlowMode() {
    audioState.isSlowMode = !audioState.isSlowMode;
    notifyListeners();
  },

  setRate(rate: number) {
    audioState.rate = rate;
    notifyListeners();
  },

  setOnPlayComplete(callback: (() => void) | null) {
    onPlayComplete = callback;
  },

  async playSequence(words: string[]) {
    if (words.length === 0) return;
    this.stop();
    audioState.queue = words.slice(1);
    notifyListeners();
    await playWordInternal(words[0]);
  },

  async play(word: string) {
    if (audioState.isPlaying && audioState.currentWord === word) {
      this.stop();
      return;
    }

    this.stop();
    await playWordInternal(word);
  },

  stop() {
    speechSynthesis.cancel();
    audioState.isPlaying = false;
    audioState.currentWord = null;
    audioState.queue = [];
    notifyListeners();
  },

  prefetch(word: string) {
    fetchAudio(word);
  },

  clearCache() {
    audioCache.clear();
    pendingRequests.clear();
  },
};
