import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const items = await prisma.pantryItem.findMany({
            orderBy: { expiryDate: 'asc' }
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
                'Content-Disposition': 'attachment; filename="larder-inventory.csv"',
            },
        });
    } catch (error) {
        console.error('Export failed:', error);
        return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
    }
}
