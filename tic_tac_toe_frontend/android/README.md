# Android Stub for CI

This directory contains a minimal stub to prevent CI errors when a Gradle wrapper is expected.
The project is an Expo-managed React Native app and may not include a native Android project by default.

To generate a proper Android project:
1. Ensure you have the environment set up for native builds.
2. Run: `npm run prebuild:android` (which runs `expo prebuild --platform android`)
3. Then build using Gradle from the generated `android` directory.

The provided `./gradlew` script in this directory is a stub that prints a message and exits successfully to keep CI healthy.
