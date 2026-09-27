# Xonbay Business

A standalone Expo and React Native app for Xonbay shop owners and team members. It connects to the existing Xonbay API and has its own app identity, account flow, and merchant navigation.

## Included

- Sign in with a Xonbay account; email verification and account creation
- List owned and member shops, create a shop, and switch the active shop
- Shop dashboard with sales, order counts, and low stock
- Paginated orders and product listings
- Adjust product stock with confirmation
- Secure local session storage and sign out

## Run locally

Use Node.js 20 or newer. From the project directory:

```sh
npm install
npx expo start
```

Open the QR code with Expo Go, or run `npm run android` / `npm run ios` with a configured native toolchain. For TypeScript checking run `npm run typecheck`.

The default API base is `https://api.xonbay.com/v1`. To use another environment, set `EXPO_PUBLIC_API_URL` in a local `.env` file (for example, `EXPO_PUBLIC_API_URL=https://your-api.example/v1`). Values with the `EXPO_PUBLIC_` prefix are bundled into the app; never put secrets there. The app sends the bearer token from SecureStore with authenticated requests.

## Release setup

`app.json` gives this app its own bundle ID, Android package, and URL scheme. Replace those identifiers if the organization uses another namespace. Link this project to the Xonbay Expo account and add the generated EAS project ID before creating store builds. App icons, splash imagery, push credentials, and store metadata still need to be supplied.

## Current scope

Orders are visible in the app; fulfillment changes are not yet implemented. Product listings can be viewed and their stock adjusted; creating a listing still uses the existing seller dashboard. This first version does not include offline POS, payment collection, or notifications. The API contract should be exercised with a staging merchant account before release.
