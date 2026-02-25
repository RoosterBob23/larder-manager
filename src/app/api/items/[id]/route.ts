import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const item = await prisma.pantryItem.findUnique({
            where: { id: parseInt(id) },
        });

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        return NextResponse.json(item);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, quantity, expiryDate, purchaseDate } = body;

        const updatedItem = await prisma.pantryItem.update({
            where: { id: parseInt(id) },
            data: {
                name,
                quantity: quantity ? parseInt(quantity) : undefined,
                expiryDate: expiryDate ? new Date(expiryDate) : undefined,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
            },
        });

        return NextResponse.json(updatedItem);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.pantryItem.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }
}
