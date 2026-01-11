import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!;


export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-signature-ed25519')!;
  const timestamp = req.headers.get('x-signature-timestamp')!;
  const body = await req.json();

  if (!verifyDiscordRequest(signature, timestamp, body)) {
    return NextResponse.json({ error: 'Invalid request signature' }, { status: 401 });
  }

  const { type, data, member } = body;

  // PING event
  if (type === 1) return NextResponse.json({ type: 1 });

  // Slash command
  if (type === 2 && data.name === 'emailresume') {
    const linkedinPostUrl = data.options[0].value;
    const username = member.user.username;

    console.log(`Received email resume request from ${username} for URL: ${linkedinPostUrl}`);

    // Respond to Discord
    return NextResponse.json({
      type: 4, // Channel message with source
      data: { content: 'Resume request sent to API ✅' },
    });
  }

  return NextResponse.json({}, { status: 200 });
}

// Discord signature verification
function verifyDiscordRequest(signature: string, timestamp: string, body: any) {
  const msg = Buffer.from(timestamp + JSON.stringify(body));
  const sig = Buffer.from(signature, 'hex');
  const key = Buffer.from(DISCORD_PUBLIC_KEY, 'hex');
  return crypto.verify(null, msg, key, sig);
}
