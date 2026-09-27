# Xonbay Business

A separate Expo/React Native merchant app for Xonbay. Android and iOS share the same Xonbay Rails API as the marketplace. It supports saved merchant data and local changes while the phone has no internet connection.

## What works

- Sign in, verify an email and create an account. Access and refresh tokens live in SecureStore.
- View shops, the dashboard, previously opened order pages, the product catalog, and events offline after they have been fetched once for that account and shop.
- Save product and event drafts locally. They sync as **inactive products** and **draft events**, so new listings and events are not unexpectedly public. Add media, ticket tiers, variants and publishing details online before activating them.
- Record an in-person cash sale offline from synced active products without variants. The server recalculates the total and deducts stock when the sale syncs. A queued sale is not yet an accepted online order.
- Queue stock adjustments, review server stock conflicts, retry rejected changes, and discard local changes explicitly. The Sync screen shows pending and failed operations.
- Automatically retry safe queued operations when network access returns or the app becomes active. Product, event and sale creates use stable operation IDs to avoid duplicates on retry.

## Install and run

Use Node.js 20.19 or newer.

```sh
npm ci
cp .env.example .env
npm start
```

Open in Expo Go, or use `npm run android` / `npm run ios` with a configured native toolchain. Run `npm run typecheck` before committing. `npx expo export --platform android` verifies the Android JS bundle.

The default API is `https://api.xonbay.com/v1`. Set `EXPO_PUBLIC_API_URL` to a staging API URL for testing. Expo embeds every `EXPO_PUBLIC_` value in the app; never use it for secrets.

## Offline behavior and recovery

The app uses SQLite for cached server snapshots and a persistent, account-scoped outbox. Sync only removes an operation after the server accepts it. A retry after an uncertain response sends the same operation ID. Backend support in [xonbay-backend](https://github.com/assadounto/xonbay-backend) must be deployed **before** releasing this client; the backend PR adds duplicate protection for cash sales and product/event drafts.

The product/event catalog is downloaded across pages when online, with a safety limit of 200 pages per shop. Orders are cached by the pages opened. First sign-in, shop creation, downloads of unseen data, payment collection and media uploads require connectivity. Offline POS handles cash only: do not interpret a local receipt as a card or MoMo payment confirmation. If stock or permissions changed online, sync can reject a sale. Reconcile a collected cash payment in the Sync screen before recording it elsewhere. Stock changes are compared with the server's current quantity before applying; a changed quantity becomes a conflict for review.

Local snapshots and pending changes remain on the device when signed out and are isolated by account ID. They are removed by uninstalling the app. Avoid using a shared device for customer data; device storage is protected by the operating system, while session tokens use SecureStore.

## Build and release

`app.json` contains a provisional icon, splash, Android package, iOS bundle ID and URL scheme. Confirm the brand assets and identifiers before a store release. `eas.json` contains development, preview APK and production profiles.

```sh
npm install --global eas-cli
eas login
eas init
eas build --platform android --profile preview
eas build --platform ios --profile production
```

`eas init` must be run by a member of the Xonbay Expo account to link a real EAS project. Store signing, provisioning, push credentials, and store metadata must be set up in that account. No credentials belong in this repository. The default public production API is embedded in the binary; configure staging through the appropriate EAS environment when building a test app.

Before release, migrate/deploy the backend idempotency change, sign in with a staging merchant account, create products/events, test queued sales with a dropped connection and a lost response, verify stock conflicts, and run native Android/iOS builds on real devices. Web SQLite needs COEP/COOP response headers on the hosting server; this project targets native mobile builds.

## Current limitations

Product images, event media/tickets, variant sales, order fulfillment, notifications, card/MoMo checkout, and offline shop creation are future screens. These existing Xonbay features still require their current web or marketplace flow. The app currently displays prices and records POS sales in GHS, matching the in-house order API.
