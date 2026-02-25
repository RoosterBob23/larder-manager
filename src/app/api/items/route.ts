import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const items = await prisma.pantryItem.findMany({
            orderBy: { expiryDate: 'asc' }, // items expiring soonest first
        });
        return NextResponse.json(items);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, barcode, quantity, expiryDate, purchaseDate } = body;

        const newItem = await prisma.pantryItem.create({
            data: {
                name,
                barcode,
                quantity: quantity ? parseInt(quantity) : 1,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
            },
        });

        return NextResponse.json(newItem);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
    }
}
