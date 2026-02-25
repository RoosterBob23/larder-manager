# Larder Manager Deployment Guide

## 1. Prerequisites
- Docker (installed and running)
- Git (optional, or just copy files)
- **HTTPS** (Required for Barcode Scanner context on mobile).
  - *Note*: If accessing via `http://localhost:3000` on the device locally, it works.
  - If accessing from a phone to a computer (e.g., `http://192.168.1.50:3000`), the camera **might be blocked** by Android/iOS security policies.
  - **Workaround**: On Chrome (Android), go to `chrome://flags/#unsafely-treat-insecure-origin-as-secure` and add your server IP.

## 2. Installation (Docker)

You can run the application directly using the provided `docker-compose.yml`.

1.  Open a terminal/command prompt in the project folder.
2.  Run the following command to build and start the container:
    ```bash
    docker-compose up -d --build
    ```
3.  The application will be available at `http://localhost:3000`.

## 3. Configuration
The application uses a database file stored in `./data/pantry.db`. This folder is mapped into the container, so your data persists even if you delete the container.

### Environment Variables (.env)
The `.env` file contains your database location and VAPID keys for notifications.
**Do not delete this file**, or you will lose the ability to send updates to existing subscribers.

## 4. Using the App
1.  **Add Item**: Click the "+" button. Tap "Scan Barcode" to use the camera. If recognized (via OpenFoodFacts), the name populates. Enter quantity and expiration.
2.  **Edit/Delete**: Tap the Edit (Pencil) or Delete (Trash) icons on the list.
3.  **Settings**:
    - **Days before expiration**: Set how many days in advance you want alerts.
    - **Enable Notifications**: Tap to allow push notifications on this device.

## 5. Alerts
The system checks for expiring items once every 24 hours (and on startup). If items are found expiring in exactly *X* days (configured in settings), you will receive a push notification.

## Troubleshooting
- **Camera not opening**: Ensure you are on HTTPS or have enabled the "Insecure origins" flag on your phone.
- **No Notifications**: Ensure you clicked "Enable Notifications" in Settings and gave browser permission.

## Development (Running locally without Docker)
If you want to run it on your Windows machine directly:
1.  Install Node.js 18+.
2.  Run `npm install`.
3.  Run `npm start` (This starts both the web server and the background worker).
4.  Open `http://localhost:3000`.
