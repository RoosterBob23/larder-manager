const https = require('https');
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testHA() {
    console.log('Fetching HA settings from database...');
    const settingsList = await prisma.systemSetting.findMany({
        where: {
            key: { in: ['haUrl', 'haToken', 'haService'] }
        }
    });

    const config = {};
    settingsList.forEach(s => config[s.key] = s.value);

    const { haUrl, haToken, haService } = config;

    if (!haUrl || !haToken || !haService) {
        console.error('Missing HA configuration in database. Please configure it in the app settings first.');
        process.exit(1);
    }

    const services = haService.split(',').map(s => s.trim()).filter(Boolean);
    const payload = {
        title: 'Test Notification',
        message: 'This is a test notification from Larder Manager!'
    };

    console.log(`Found ${services.length} service(s): ${services.join(', ')}`);

    for (const service of services) {
        try {
            const url = new URL(`${haUrl.replace(/\/$/, '')}/api/services/notify/${service}`);
            const protocol = url.protocol === 'https:' ? https : http;
            const postData = JSON.stringify(payload);

            console.log(`Sending test to ${service}...`);

            const req = protocol.request(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${haToken}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        console.log(`✅ Success: Test notification sent to ${service}`);
                    } else {
                        console.error(`❌ Failed: HA returned ${res.statusCode} for ${service}`);
                        console.error('Response:', body);
                    }
                });
            });

            req.on('error', (e) => {
                console.error(`❌ Error: Could not connect to HA for ${service}:`, e.message);
            });

            req.write(postData);
            req.end();
        } catch (err) {
            console.error(`❌ Error: Invalid URL or configuration for ${service}:`, err.message);
        }
    }
}

testHA();
