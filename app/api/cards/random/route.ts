import { NextResponse } from 'next/server';
import { readCards } from '@/data/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cards = readCards().filter(c => c.status === 'enabled' && !c.isDeleted);
    
    if (cards.length === 0) {
      console.error('No enabled cards available for random selection');
      return NextResponse.json(null);
    }

    const randomIndex = Math.floor(Math.random() * cards.length);
    const card = cards[randomIndex];

    const responseCard = {
      id: card.id,
      image: card.image,
      imagePosition: card.imagePosition,
      lyric: card.lyric,
      blessing: card.blessing,
      source: card.source,
    };

    return NextResponse.json(responseCard, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching random card:', error);
    return NextResponse.json(null);
  }
}