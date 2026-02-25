import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const subscription = await request.json();
    const endpoint = subscription.endpoint;
    const keys = JSON.stringify(subscription.keys);

    await prisma.notificationSubscription.upsert({
        where: { endpoint },
        update: { keys, createdAt: new Date() },
        create: { endpoint, keys },
    });

    return NextResponse.json({ success: true });
}
