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

        const headers = ['ID', 'Name', 'Barcode', 'Quantity', 'Purchase Date', 'Expiry Date'];
        const rows = items.map(item => [
            item.id,
            `"${item.name.replace(/"/g, '""')}"`,
            item.barcode || '',
            item.quantity,
            item.purchaseDate.toISOString().split('T')[0],
            item.expiryDate ? item.expiryDate.toISOString().split('T')[0] : ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="larder-report-${days}-days.csv"`,
            },
        });
    } catch (error) {
        console.error('Export report failed:', error);
        return NextResponse.json({ error: 'Failed to export report' }, { status: 500 });
    }
}
