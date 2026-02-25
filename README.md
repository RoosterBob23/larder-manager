# Larder Manager 🥫

A mobile-friendly, Dockerized pantry inventory manager with barcode scanning, OCR expiration date detection, and push notification alerts.

## 🚀 Quick Start (Docker)

To run this application on your own server:

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/YOUR_USERNAME/larder-manager.git
    cd larder-manager
    ```

2.  **Configure Environment**:
    Create a `.env` file in the root directory:
    ```env
    DATABASE_URL="file:./data/pantry.db"
    
    # Generate these via 'node scripts/generate-vapid.js'
    NEXT_PUBLIC_VAPID_PUBLIC_KEY="YOUR_PUBLIC_KEY"
    VAPID_PRIVATE_KEY="YOUR_PRIVATE_KEY"
    VAPID_SUBJECT="mailto:admin@example.com"
    ```

3.  **Launch with Docker**:
    ```bash
    docker compose up -d --build
    ```

4.  **Access**:
    Open `http://localhost:3000` in your browser.

## ✨ Features
- **Barcode Scanning**: Integrated with OpenFoodFacts.
- **OCR Expiration Scan**: Read dates directly from packaging using your camera.
- **Push Alerts**: Get notified before your food expires.
- **CSV Export**: Export your entire inventory for backup.
- **Dark Mode**: Premium, mobile-first design.

## 📦 Tech Stack
- **Framework**: Next.js (React)
- **Database**: SQLite (managed by Prisma)
- **Deployment**: Docker Compose
- **Alerts**: Web Push API

## 🧹 Maintenance
The application data is persisted in the `./data` folder on your host machine.
To update the app, simply run `git pull` followed by another `docker compose up -d --build`.
