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
        await resolveDns(domain);
        // Only return resolution status, never expose IP addresses
        return NextResponse.json({ resolved: true });
    } catch (error: unknown) {
        return NextResponse.json({ resolved: false, error: 'Domain could not be resolved' });
    }
}
