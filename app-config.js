window.KW_PLAYER_CONFIG = window.KW_PLAYER_CONFIG || {
  demoMode: true,
  apiBaseUrl: "",
  liveStreamApiBaseUrl: "",
  localLiveStreamApiBaseUrl: "",
  syncPlayApiBaseUrl: "",
  coastApiBaseUrl: "",
  metadataApiUrl: "",
  authStorageKey: "impalaDemo.demoSession",
  playlistStoragePrefix: "impalaDemo",
  instanceStorageId: "",
  builtInPlaylistsEnabled: true,
  enabledBuiltInPlaylistIds: ["songsKw"],
  brandName: "Impala Demo Edition",
  editionName: "UI Emulation",
  appVersion: "0.001-demo",
  appBuildDate: "2026.09.28",
  mkvPlaybackEnabled: false,
  localHelperDownloadUrl: "",
};

window.ImpalaConfig =
  window.ImpalaConfig ||
  (() => {
    const config = window.KW_PLAYER_CONFIG || {};

    function cleanStorageSegment(value) {
      return String(value || "")
        .trim()
        .replace(/[^a-z0-9._:-]/gi, "-")
        .replace(/^-+|-+$/g, "");
    }

    function getStoragePrefix() {
      const basePrefix =
        cleanStorageSegment(config.playlistStoragePrefix) || "impalaStreamer";
      const instanceStorageId = cleanStorageSegment(config.instanceStorageId);
      return instanceStorageId
        ? `${basePrefix}.${instanceStorageId}`
        : basePrefix;
    }

    function getAuthStorageKey() {
      if (config.authStorageKey && !config.instanceStorageId) {
        return String(config.authStorageKey);
      }

      return `${getStoragePrefix()}.authSession`;
    }

    const preferencesKey = `${getStoragePrefix()}.uiPreferences`;

    function readPreferences() {
      try {
        const rawPreferences = localStorage.getItem(preferencesKey);
        return rawPreferences ? JSON.parse(rawPreferences) : {};
      } catch (error) {
        console.error("Unable to read Impala runtime preferences:", error);
        return {};
      }
    }

    function cleanUrl(value) {
      return String(value || "")
        .trim()
        .replace(/\/+$/, "");
    }

    function getCloudApiBaseUrl() {
      if (config.demoMode === true) return "";
      const preferences = readPreferences();
      return cleanUrl(preferences.cloudApiBaseUrl || config.apiBaseUrl || "");
    }

    function getLiveStreamApiBaseUrl() {
      if (config.demoMode === true) return "";
      const hostname = window.location?.hostname || "";
      const isLocalPreview =
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "::1";
      const configuredUrl =
        config.liveStreamApiBaseUrl ||
        (isLocalPreview ? config.localLiveStreamApiBaseUrl : "");
      return cleanUrl(configuredUrl);
    }

    function getSyncPlayApiBaseUrl() {
      if (config.demoMode === true) return "";
      const preferences = readPreferences();
      return cleanUrl(
        preferences.syncPlayApiBaseUrl || config.syncPlayApiBaseUrl || "",
      );
    }

    function getCoastApiBaseUrl() {
      if (config.demoMode === true) return "";
      const preferences = readPreferences();
      return cleanUrl(
        preferences.coastApiBaseUrl || config.coastApiBaseUrl || "",
      );
    }

    function getInstanceId() {
      if (config.demoMode === true) return "";
      const preferences = readPreferences();
      return String(preferences.instanceId || "").trim();
    }

    function getMetadataApiUrl() {
      const preferences = readPreferences();
      if (preferences.metadataEnabled !== true) return "";
      return cleanUrl(config.metadataApiUrl || "");
    }

    function isMkvPlaybackEnabled() {
      return config.mkvPlaybackEnabled === true;
    }

    function areBuiltInPlaylistsEnabled() {
      return config.builtInPlaylistsEnabled === true;
    }

    function getEnabledBuiltInPlaylistIds() {
      if (!areBuiltInPlaylistsEnabled()) {
        return [];
      }

      return Array.isArray(config.enabledBuiltInPlaylistIds)
        ? config.enabledBuiltInPlaylistIds.map((playlistId) =>
            String(playlistId),
          )
        : [];
    }

    return {
      preferencesKey,
      getStoragePrefix,
      getAuthStorageKey,
      getCloudApiBaseUrl,
      getLiveStreamApiBaseUrl,
      getSyncPlayApiBaseUrl,
      getCoastApiBaseUrl,
      getMetadataApiUrl,
      getInstanceId,
      isMkvPlaybackEnabled,
      areBuiltInPlaylistsEnabled,
      getEnabledBuiltInPlaylistIds,
    };
  })();
