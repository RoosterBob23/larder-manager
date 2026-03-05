import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        let days = parseInt(searchParams.get('days') || '');

        if (isNaN(days)) {
            const daysSetting = await prisma.systemSetting.findUnique({
                where: { key: 'daysBeforeAlert' }
            });
            days = parseInt(daysSetting?.value || '3');
        }

        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() + days);
        thresholdDate.setHours(23, 59, 59, 999);

        const items = await prisma.pantryItem.findMany({
            where: {
                expiryDate: {
                    lte: thresholdDate,
                    not: null,
                }
            },
            orderBy: { expiryDate: 'asc' },
        });

        return NextResponse.json({ items, days });
    } catch (error) {
        console.error('Failed to fetch report:', error);
        return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
    }
}
