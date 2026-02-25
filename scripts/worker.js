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

async function checkExpirations() {
    console.log('Checking expirations...');
    try {
        const setting = await prisma.systemSetting.findUnique({ where: { key: 'daysBeforeAlert' } });
        const daysBefore = setting ? parseInt(setting.value) : 3;

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

            const subscriptions = await prisma.notificationSubscription.findMany();
            if (subscriptions.length === 0) {
                console.log("No subscriptions found.");
                return;
            }

            const payload = JSON.stringify({
                title: 'Pantry Alert',
                body: `${items.length} item(s) are expiring in ${daysBefore} days (${items[0].name}...)`,
                url: '/'
            });

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
