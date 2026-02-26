import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    const settings = await prisma.systemSetting.findMany({
        where: {
            key: { in: ['daysBeforeAlert', 'haUrl', 'haToken', 'haService'] }
        }
    });

    const config: Record<string, string> = {};
    settings.forEach(s => {
        config[s.key] = s.value;
    });

    return NextResponse.json({
        days: parseInt(config.daysBeforeAlert || '3'),
        haUrl: config.haUrl || '',
        haToken: config.haToken || '',
        haService: config.haService || ''
    });
}

export async function POST(request: Request) {
    const { days, haUrl, haToken, haService } = await request.json();

    const updates = [
        { key: 'daysBeforeAlert', value: days.toString() },
        { key: 'haUrl', value: haUrl || '' },
        { key: 'haToken', value: haToken || '' },
        { key: 'haService', value: haService || '' }
    ];

    for (const update of updates) {
        await prisma.systemSetting.upsert({
            where: { key: update.key },
            update: { value: update.value },
            create: { key: update.key, value: update.value },
        });
    }

    return NextResponse.json({ success: true });
}
