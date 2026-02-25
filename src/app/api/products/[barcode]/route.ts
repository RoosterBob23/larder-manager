import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ barcode: string }> }) {
    const { barcode } = await params;

    if (!barcode) {
        return NextResponse.json({ error: 'Barcode required' }, { status: 400 });
    }

    try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, {
            headers: {
                'User-Agent': 'LarderManager/1.0 (Integration Test)',
            },
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Product not found on OFF' }, { status: 404 });
        }

        const data = await response.json();

        if (data.status === 1) {
            return NextResponse.json({
                name: data.product.product_name,
                image: data.product.image_url,
                brand: data.product.brands,
            });
        } else {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'External API error' }, { status: 500 });
    }
}
