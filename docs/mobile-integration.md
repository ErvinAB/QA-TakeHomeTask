# Mobile Integration Design

## Scope

This document proposes an architecture for native Android and iOS test automation. It does not implement a mobile suite — Playwright remains responsible for API and Web testing.

## Technology Choices

| Layer | Technology | Reason |
|-------|-----------|--------|
| Mobile automation | **Appium** | Cross-platform native app testing standard |
| Android driver | **UiAutomator2** | Android-native accessibility and interaction |
| iOS driver | **XCUITest** | Apple's native UI testing framework |
| Test runner | **WebdriverIO with TypeScript** | Mature Appium integration, strong TypeScript support |
| Language | **TypeScript** | Consistency with API and Web layers |

Playwright mobile-browser emulation is **not** native mobile testing. This design covers real native app automation.

## Proposed Structure

```
src/mobile/
├── screens/                    # Screen objects (mobile equivalent of page objects)
│   ├── login.screen.ts
│   ├── accounts.screen.ts
│   └── transfer.screen.ts
├── capabilities/               # Platform-specific Appium capabilities
│   ├── android.ts
│   └── ios.ts
└── platform/                   # Platform-specific adapters
    ├── android.adapter.ts
    └── ios.adapter.ts

tests/mobile/
├── authentication.spec.ts
├── transfer.spec.ts
├── session.spec.ts
├── offline-recovery.spec.ts
└── regional.spec.ts

wdio.android.conf.ts           # WebdriverIO config for Android
wdio.ios.conf.ts               # WebdriverIO config for iOS
```

## Shared Components

These components are shared with the API and Web layers:

| Component | Shared | Notes |
|-----------|--------|-------|
| Region configuration | Yes | Same RegionConfig provides mobile app URLs and credentials |
| API client | Yes | Used for test setup and verification |
| Runtime schemas | Yes | Validates API responses in cross-layer mobile tests |
| Test-data factories | Yes | Same CustomerFactory generates unique customers |
| Credentials strategy | Yes | Environment variable overrides per region |
| Business test data | Yes | Same scenarios, different execution layer |
| Reporting conventions | Yes | JUnit XML, HTML report structure |

## Platform-Specific Boundaries

| Concern | Android | iOS |
|---------|---------|-----|
| Driver | UiAutomator2 | XCUITest |
| Package identifier | `package` | `bundleId` |
| App binary | `.apk` or `.aab` | `.ipa` or `.app` |
| Permission handling | `autoGrantPermissions` capability | Custom alert dismissal |
| Platform locators | `accessibilityId`, `resourceId` | `accessibility id`, `label` |
| Simulator/emulator | Android Emulator | iOS Simulator |
| OS-level interactions | UiAutomator APIs | XCUITest APIs |

## Screen Object Pattern

Screen objects model platform-specific interactions while exposing a consistent API:

```typescript
// screens/login.screen.ts
export interface LoginScreen {
  enterUsername(username: string): Promise<void>;
  enterPassword(password: string): Promise<void>;
  tapLogin(): Promise<void>;
  getErrorText(): Promise<string>;
}

// platform/android.adapter.ts
export class AndroidLoginScreen implements LoginScreen { ... }

// platform/ios.adapter.ts
export class IosLoginScreen implements LoginScreen { ... }
```

Tests reference the `LoginScreen` interface, never platform-specific implementations. The adapter is selected at runtime based on capabilities.

**Avoid platform conditionals in test specifications.** The runner and adapter pattern handle platform differences.

## Shared Accessibility Identifiers

Both Android and iOS apps should expose the same accessibility identifiers:

- `login.username.input`
- `login.password.input`
- `login.submit.button`
- `accounts.overview.list`
- `transfer.source.account`
- `transfer.target.account`
- `transfer.amount.input`
- `transfer.submit.button`

This enables screen objects to share locator logic where the platform APIs allow it.

## Proposed Mobile Test Scenarios

1. **Successful login** — Enter valid credentials, verify account overview
2. **Invalid login** — Enter invalid credentials, verify error message
3. **API-created account displayed in mobile** — API creates account, mobile shows it in overview
4. **Mobile transfer verified through API** — Mobile performs transfer, API confirms single transaction and expected balances
5. **Duplicate transfer submission/retry protection** — Attempt duplicate transfer, verify idempotent behavior
6. **Session expiry** — Wait for session timeout, verify re-login prompt
7. **Offline/error recovery** — Disconnect network, attempt action, verify graceful error, reconnect, verify recovery
8. **Regional configuration validation** — Switch REGION env, verify correct locale, timezone, and app configuration

## Most Valuable Cross-Layer Flow

```
API → Creates customer + funds accounts
    ↓
Mobile → Logs in, performs transfer
    ↓
API → Verifies exactly one transaction recorded, correct balances
```

This flow proves the mobile app interacts correctly with the same backend that the API tests exercise.

## CI Strategy

| Job | Runner | Notes |
|-----|--------|-------|
| API tests | `ubuntu-latest` | No browser needed |
| Web tests | `ubuntu-latest` | Chromium only |
| Android tests | `ubuntu-latest` + emulator | Or device cloud (BrowserStack, Sauce Labs) |
| iOS tests | `macos-latest` + Simulator | Or device cloud for cross-platform coverage |

### CI Structure

```yaml
jobs:
  api-tests:        # Linux
  web-tests:        # Linux + Chromium
  android-tests:    # Linux + Android emulator (or cloud)
  ios-tests:        # macOS + iOS Simulator (or cloud)
```

### PR Pipeline
- **Smoke suite** (login, critical path) — runs on every PR
- **Full regression** — runs nightly

### Release Pipeline
- Full platform regression on selected real devices
- Upload: Appium logs, screenshots, videos, device logs, JUnit results
- Metadata: app version, OS version, region, platform

## Implementation Effort

- **Screen objects**: ~2-3 days for core screens (login, accounts, transfer)
- **Capabilities and configuration**: ~1 day
- **Platform adapters**: ~2 days for Android + iOS
- **Cross-layer integration**: ~1 day
- **CI pipeline**: ~1-2 days
- **Total estimate**: ~8-10 engineering days for a solid foundation
