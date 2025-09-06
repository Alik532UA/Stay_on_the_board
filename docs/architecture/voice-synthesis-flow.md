# Voice Synthesis Data Flow

This document outlines the architecture and data flow for the voice synthesis feature, including voice selection, settings management, and speech execution.

## Core Principles

The implementation adheres to the core architectural principles of the project:

- **Single Source of Truth (SSoT):** The `gameSettingsStore` is the single source of truth for all user-configurable voice settings (selected voice, rate, etc.).
- **Reactivity:** The system is designed to be reactive. UI components and stores listen for changes in dependencies (like language changes or store updates) and update themselves automatically.

## Components

The system is divided into several key modules:

1.  **`gameSettingsStore.ts`**: The SSoT for all settings. It holds `selectedVoiceURI`, `speechRate`, and other voice-related configurations.

2.  **`speechService.js`**: A low-level service that directly interacts with the browser's `SpeechSynthesis` API. It is responsible for fetching available voices and creating and speaking utterances. It reads settings directly from `gameSettingsStore` at the moment of speech execution.

3.  **`voiceStore.js`**: Manages the state related to the list of available voices. 
    - It listens for changes to the application's `locale` (language) and triggers a re-initialization of the voice list to ensure it's always relevant.
    - It subscribes to its own `availableVoices` store. When the list of voices is populated, it checks `gameSettingsStore` and sets a default voice if none is already selected.

4.  **`VoiceSettings.svelte` & `VoiceList.svelte`**: These are the UI components.
    - They are responsible for rendering the controls (buttons, lists).
    - They update the `gameSettingsStore` when the user changes a setting.
    - `VoiceList.svelte` is fully reactive: it subscribes to `gameSettingsStore` to visually reflect the currently selected voice, even if the change originated from somewhere else (like the default voice logic).

## Data Flow

### 1. Initialization & Default Voice

- The application starts, and `voiceStore.js` is imported.
- `voiceStore` immediately subscribes to the `locale` store.
- When a UI component like `VoiceList.svelte` mounts, it calls `initializeVoices()`.
- `initializeVoices()` calls `speechService.loadAndGetVoices()` and populates the `availableVoices` store.
- A separate subscription within `voiceStore` listens to `availableVoices`. When this list becomes populated, it checks if a `selectedVoiceURI` exists in `gameSettingsStore`. If not, it sets the first voice in the list as the default.

### 2. Language Change

- The user changes the interface language.
- The `locale` store updates.
- The subscription in `voiceStore` fires, triggering `initializeVoices()` again.
- The voice list is re-filtered for the new language, the `availableVoices` store is updated, and the UI reacts to this change.

### 3. User Interaction

- The user clicks a button in `VoiceSettings.svelte` or `VoiceList.svelte`.
- The `onclick` handler directly calls `gameSettingsStore.updateSettings()` with the new value.
- For immediate feedback, the handler also calls `speakTestPhrase()`.

### 4. Speech Execution

- A function like `speakTestPhrase()` or `speakMove()` is called.
- The function reads the *current* settings (e.g., `selectedVoiceURI`, `speechRate`) directly from `gameSettingsStore` using `get()`.
- `speakTestPhrase` is self-contained: it determines the language of the selected voice and fetches the appropriate translated test phrase.
- It constructs a `SpeechSynthesisUtterance`, sets its properties (`voice`, `rate`, `lang`), and calls `window.speechSynthesis.speak()`.
- To prevent issues with stale settings, `window.speechSynthesis.cancel()` is called before speaking to clear any previously queued utterances.
