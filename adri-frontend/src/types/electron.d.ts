export {};

declare global {
  interface Window {
    electronAPI?: {
      closeWindow: () => void;
      openMiniWindow: () => void;
      // Add other methods if needed
    };
  }
}
