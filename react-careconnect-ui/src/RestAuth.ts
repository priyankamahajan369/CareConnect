import Keycloak from "keycloak-js";
export const demoMode = import.meta.env.VITE_MODE !== "live";
let keycloak: Keycloak | undefined;
export async function initializeAuth() {
  if (demoMode) return;
  keycloak = new Keycloak({
    url: import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:8180",
    realm: "careconnect",
    clientId: "careconnect-ui",
  });
  await keycloak.init({
    onLoad: "login-required",
    pkceMethod: "S256",
    checkLoginIframe: false,
  });
}
export async function accessToken() {
  if (!keycloak) return "";
  await keycloak.updateToken(30);
  return keycloak.token || "";
}
export function logout() {
  if (keycloak) void keycloak.logout({ redirectUri: location.origin });
}
export function staffAccess() {
  return (
    demoMode ||
    !!keycloak?.hasRealmRole("STAFF") ||
    !!keycloak?.hasRealmRole("ADMIN")
  );
}
