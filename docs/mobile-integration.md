# Mobile Integration Design

## Status

Mobile testing was not implemented. This document outlines how the existing architecture could extend to native mobile apps.

## What can be shared

The following components are platform-independent and can be reused without modification:

- `RegionConfig` — region definitions and port resolution
- `FireflyApiClient` — typed API client with Zod validation
- Zod schemas — request/response contract validation
- Test data factories — deterministic account and transaction generators

## What remains platform-specific

- Appium driver selection and setup (UiAutomator2 for Android, XCUITest for iOS)
- Device capabilities and emulator/simulator management
- Screen object locators and interaction patterns
- CI runners — Android needs Ubuntu + emulator, iOS needs macOS + Simulator

## Proposed structure

```
src/mobile/
├── pages/           # Screen objects
├── drivers/         # Platform-specific setup
└── fixtures/        # Mobile-specific fixtures
tests/mobile/
├── android/
└── ios/
```

## CI requirements

- Android: Ubuntu runner + Android emulator with hardware acceleration
- iOS: macOS runner + iOS Simulator
- Both require significant CI runner resources for acceptable speed
