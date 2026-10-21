import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "com.qubitsolutions.lms",
  appName: "Qubit",
  webDir: "dist",
  server: { androidScheme: "https" },
  ios: { contentInset: "automatic" },
  android: { backgroundColor: "#f8faf7" },
};
export default config;
