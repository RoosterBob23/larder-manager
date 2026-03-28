import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
    try {
        const body = await request.json();
        const { ids } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        await prisma.pantryItem.deleteMany({
            where: {
                id: {
                    in: ids.map((id: string | number) => typeof id === 'string' ? parseInt(id) : id),
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Bulk delete failed:', error);
        return NextResponse.json({ error: 'Failed to delete items' }, { status: 500 });
    }
}
