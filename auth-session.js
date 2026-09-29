// Demo sessions are local UI state only; no credential or auth service exists.
(() => {
  const demoSession = Object.freeze({ username: "demo", displayName: "Demo Visitor", token: "demo-local" });
  window.AuthSession = {
    storageKey: "impalaDemo.demoSession",
    isExpired: () => false,
    hasValidToken: () => true,
    load: () => demoSession,
    save: () => demoSession,
    clear: () => demoSession
  };
})();
