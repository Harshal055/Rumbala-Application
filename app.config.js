// app.config.js
export default {
  name: "Rumbala",
  slug: "rumbal",
  version: "1.0.3", // incremented for Play Console
  scheme: "rumbala",
  orientation: "portrait",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/icon.png",
    resizeMode: "contain",
    backgroundColor: "#FF6B35"
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.andx.rumbala",
    icon: "./assets/icon.png"
  },
  android: {
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.andx.rumbala",
    icon: "./assets/icon.png",
    versionCode: 4, // incremented for Play Console
    googleServicesFile: "./google-services.json",
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#FF6B35"
    }
  },
  web: {},
  plugins: [
    "expo-dev-client",
    "@react-native-google-signin/google-signin"
  ],

  // Add this line (or update if it exists)
  owner: "harshyaay",

  // Keep or add your existing extra.eas if present
  extra: {
    eas: {
      projectId: "5e6f32e5-0cde-421c-9021-4385499a59b7"
    }
    // ... any other extras
  }
};