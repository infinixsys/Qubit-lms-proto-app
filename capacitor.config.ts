import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "com.qubitsolutions.lms",
  appName: "Qubit Coaching",
  webDir: "dist",
  server: { androidScheme: "https" },
  ios: { contentInset: "automatic" },
  android: {
    backgroundColor: "#f6f8fc",
    allowMixedContent: process.env.QUBIT_LOCAL_ANDROID === "1",
  },
};
export default config;
