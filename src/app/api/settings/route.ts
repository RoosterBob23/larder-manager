import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    const setting = await prisma.systemSetting.findUnique({
        where: { key: 'daysBeforeAlert' },
    });
    return NextResponse.json({ days: setting ? parseInt(setting.value) : 3 });
}

export async function POST(request: Request) {
    const { days } = await request.json();
    await prisma.systemSetting.upsert({
        where: { key: 'daysBeforeAlert' },
        update: { value: days.toString() },
        create: { key: 'daysBeforeAlert', value: days.toString() },
    });
    return NextResponse.json({ success: true });
}
