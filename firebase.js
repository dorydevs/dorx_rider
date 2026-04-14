import { getApp, getApps, initializeApp } from "@react-native-firebase/app";

if (getApps().length === 0) {
  initializeApp();
}

const app = getApp();
console.log(">>> Firebase ready, app name:", app.name);

export default app;
