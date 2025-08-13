import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');
  let locations;
  if (address) {
    locations = await prisma.location.findMany({
      where: {
        address: { contains: address, mode: 'insensitive' }
      },
      orderBy: { createdAt: 'desc' }
    });
  } else {
    locations = await prisma.location.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }
  return NextResponse.json(locations);
}

export async function POST(req: NextRequest) {
  const { address, latitude, longitude, history } = await req.json();
  if (!address || !history || latitude == null || longitude == null) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const created = await prisma.location.create({
    data: { address, latitude, longitude, history }
  });
  return NextResponse.json(created);
}