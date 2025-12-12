import { appSettingsStore } from "$lib/stores/appSettingsStore";
import { gameSettingsStore } from "$lib/stores/gameSettingsStore";
import { settingsPersistenceService } from "$lib/services/SettingsPersistenceService";
import { debounce } from "$lib/utils/debounce";
import { initializeI18n } from "$lib/i18n/init.js";
import { initializeTestModeSync } from "$lib/services/testModeService";
import { rewardsService } from "$lib/services/rewardsService";
import { logService } from "$lib/services/logService";
import { appVersion } from "$lib/stores/versionStore";
import { base } from "$app/paths";

const APP_VERSION_KEY = "app_version";

class AppInitializationService {
    private unsubscribeGameSettings: (() => void) | null = null;

    public initialize() {
        logService.init("[AppInitializationService] Starting initialization...");

        // 1. Initialize app settings (theme, language)
        appSettingsStore.init();

        // 2. Initialize game settings from localStorage
        const loadedGameSettings = settingsPersistenceService.load();
        gameSettingsStore.set(loadedGameSettings);

        // 3. Subscribe to game settings changes to persist them
        const debouncedSave = debounce(settingsPersistenceService.save, 300);
        this.unsubscribeGameSettings = gameSettingsStore.subscribe((settings) => {
            debouncedSave(settings);
        });

        // 4. Initialize internationalization
        initializeI18n();

        // 5. Initialize other services
        initializeTestModeSync();
        rewardsService.init();

        // 6. Check for updates
        this.checkForUpdates();

        // 7. Expose debug tools in DEV
        if (import.meta.env.DEV) {
            (window as any).appSettingsStore = appSettingsStore;
        }

        // Remove preload class
        if (typeof document !== 'undefined') {
            document.body.classList.remove("preload-theme");
        }

        logService.init("[AppInitializationService] Initialization complete.");
    }

    public cleanup() {
        if (this.unsubscribeGameSettings) {
            this.unsubscribeGameSettings();
        }
    }

    private async checkForUpdates() {
        try {
            const response = await fetch(`${base}/version.json?v=${new Date().getTime()}`);
            if (!response.ok) return;

            const serverVersionData = await response.json();
            const serverVersion = serverVersionData.version;
            const localVersion = localStorage.getItem(APP_VERSION_KEY);
            appVersion.set(serverVersion);

            if (localVersion && localVersion !== serverVersion) {
                // Logic to show update notice is handled in layout via store subscription
                // Here we just ensure the store is updated
            } else if (!localVersion) {
                localStorage.setItem(APP_VERSION_KEY, serverVersion);
            }
        } catch (error) {
            logService.error("Failed to check for app update:", error);
        }
    }
}

export const appInitializationService = new AppInitializationService();