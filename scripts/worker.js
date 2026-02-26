const { PrismaClient } = require('@prisma/client');
const webpush = require('web-push');
require('dotenv').config();

const prisma = new PrismaClient();

if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    console.warn("VAPID keys missing. Notifications will not work.");
} else {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

const https = require('https');
const http = require('http');

async function sendHANotifications(settings, payload) {
    const { haUrl, haToken, haService } = settings;
    if (!haUrl || !haToken || !haService) return;

    const services = haService.split(',').map(s => s.trim()).filter(Boolean);
    const data = JSON.parse(payload);

    for (const service of services) {
        try {
            const url = new URL(`${haUrl.replace(/\/$/, '')}/api/services/notify/${service}`);
            const protocol = url.protocol === 'https:' ? https : http;

            const postData = JSON.stringify({
                title: data.title,
                message: data.body
            });

            console.log(`Sending HA notification to ${service}...`);

            const req = protocol.request(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${haToken}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            }, (res) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`HA notification sent to ${service}`);
                } else {
                    console.error(`HA notification failed for ${service}: ${res.statusCode}`);
                }
            });

            req.on('error', (e) => {
                console.error(`HA notification error for ${service}:`, e.message);
            });

            req.write(postData);
            req.end();
        } catch (err) {
            console.error(`Failed to trigger HA notification for ${service}:`, err.message);
        }
    }
}

async function checkExpirations() {
    console.log('Checking expirations...');
    try {
        const settingsList = await prisma.systemSetting.findMany({
            where: {
                key: { in: ['daysBeforeAlert', 'haUrl', 'haToken', 'haService'] }
            }
        });

        const config = {};
        settingsList.forEach(s => config[s.key] = s.value);

        const daysBefore = config.daysBeforeAlert ? parseInt(config.daysBeforeAlert) : 3;

        // Calculate target date range (items expiring EXACTLY in 'daysBefore' days)
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysBefore);

        // We look for items expiring between start and end of that target day
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const items = await prisma.pantryItem.findMany({
            where: {
                expiryDate: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        if (items.length > 0) {
            console.log(`Found ${items.length} items expiring on ${startOfDay.toLocaleDateString()}`);

            const payload = JSON.stringify({
                title: 'Pantry Alert',
                body: `${items.length} item(s) are expiring in ${daysBefore} days (${items[0].name}...)`,
                url: '/'
            });

            // Web Push Notifications
            const subscriptions = await prisma.notificationSubscription.findMany();
            if (subscriptions.length > 0) {
                for (const sub of subscriptions) {
                    try {
                        await webpush.sendNotification({
                            endpoint: sub.endpoint,
                            keys: JSON.parse(sub.keys)
                        }, payload);
                        console.log(`Sent notification to ${sub.endpoint.slice(0, 20)}...`);
                    } catch (err) {
                        console.error('Failed to send for sub:', sub.id, err.statusCode);
                        if (err.statusCode === 410 || err.statusCode === 404) {
                            console.log('Deleting invalid subscription');
                            await prisma.notificationSubscription.delete({ where: { id: sub.id } });
                        }
                    }
                }
            } else {
                console.log("No Web Push subscriptions found.");
            }

            // Home Assistant Notifications
            await sendHANotifications(config, payload);

        } else {
            console.log("No items found expiring exactly on this day.");
        }
    } catch (err) {
        console.error('Error in worker:', err);
    }
}

// Run check
checkExpirations();

// Schedule every 24 hours
setInterval(checkExpirations, 24 * 60 * 60 * 1000);
