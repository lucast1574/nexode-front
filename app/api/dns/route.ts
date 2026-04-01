import { NextResponse } from 'next/server';
import dns from 'dns';
import { promisify } from 'util';

const resolveDns = promisify(dns.resolve);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
        return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    try {
        const addresses = await resolveDns(domain);
        return NextResponse.json({ resolved: true, addresses });
    } catch (error: unknown) {
        return NextResponse.json({ resolved: false, error: (error as Error).message });
    }
}
