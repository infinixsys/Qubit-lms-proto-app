import { Capacitor, CapacitorHttp, registerPlugin } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
export const isNative = Capacitor.isNativePlatform();
const SecureSession = registerPlugin<{
  get(): Promise<{ value?: string }>;
  set(v: { value: string }): Promise<void>;
  clear(): Promise<void>;
}>("SecureSession");
let backend = "",
  token = "";
export async function initializeNative() {
  if (!isNative) return;
  backend = (await Preferences.get({ key: "qubit-backend" })).value || "";
  try {
    token = (await SecureSession.get()).value || "";
  } catch {
    token = "";
  }
}
export const backendUrl = () => backend;
export async function setBackend(value: string) {
  const url = new URL(value.trim());
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error(
      "Use the server address only, for example http://192.168.1.4:7310",
    );
  if (!import.meta.env.VITE_LOCAL_ANDROID && url.protocol !== "https:")
    throw new Error("This build requires an HTTPS server.");
  backend = url.origin;
  token = "";
  await SecureSession.clear();
  await Preferences.set({ key: "qubit-backend", value: backend });
}
export const absoluteApiPath = (path: string) =>
  isNative ? backend + path : (import.meta.env.VITE_API_URL || "") + path;
export const nativeHeaders = (): Record<string, string> =>
  isNative
    ? {
        "X-Qubit-Platform": "android",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      }
    : {};
export async function nativeRequest(path: string, options: RequestInit) {
  if (!backend) throw new Error("Connect to your institute server first.");
  const response = await CapacitorHttp.request({
    url: backend + "/api/v1" + path,
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Qubit-Surface": "learner",
      ...nativeHeaders(),
      ...(options.headers as Record<string, string>),
    },
    data: options.body ? JSON.parse(String(options.body)) : undefined,
    connectTimeout: 15000,
    readTimeout: 60000,
  });
  return {
    status: response.status,
    ok: response.status >= 200 && response.status < 300,
    json: async () => response.data,
  };
}
export async function storeNativeSession(data: any) {
  if (isNative && data.nativeToken) {
    token = data.nativeToken;
    await SecureSession.set({ value: token });
    delete data.nativeToken;
  }
}
export async function clearNativeSession() {
  token = "";
  if (isNative) await SecureSession.clear();
}
