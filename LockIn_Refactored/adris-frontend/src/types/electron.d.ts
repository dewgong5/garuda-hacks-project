export {};

declare global {
  interface Window {
    electronAPI?: {
      closeWindow: () => void;
      openMiniWindow: () => void;
      launchLockin: () => void;
      // Add other methods if needed
    };
  }
}
