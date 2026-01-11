import { NextRequest, NextResponse } from 'next/server';

import { verifyKey } from 'discord-interactions';

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!;


export async function POST(req: NextRequest) {
  // Read raw body for signature verification
  const rawBody = await req.text();

  // Log incoming headers for debugging
  console.log('Incoming Headers:', {
    signature: req.headers.get('x-signature-ed25519'),
    timestamp: req.headers.get('x-signature-timestamp'),
  });

  const signature = req.headers.get('x-signature-ed25519')!;
  const timestamp = req.headers.get('x-signature-timestamp')!;

  // Verify Discord request
  if (!verifyKey(rawBody, signature, timestamp, DISCORD_PUBLIC_KEY)) {
    return NextResponse.json({ error: 'Invalid request signature' }, { status: 401 });
  }

  // Parse JSON AFTER verification
  const body = JSON.parse(rawBody);
  const { type, data, member } = body;

  // Respond to PING (Discord validation)
  if (type === 1) return NextResponse.json({ type: 1 });

  // Handle /emailresume command
  if (type === 2 && data.name === 'emailresume') {
    try {
      const linkedinPostUrl = data.options[0].value;
      const username = member.user.username;

    console.log(`Received /emailresume command from ${username} for URL: ${linkedinPostUrl}`);

      // Respond to Discord
      return NextResponse.json({
        type: 4, // Channel message with source
        data: {
          content: 'Resume request sent to API ✅',
          flags: 64, // ephemeral message (only user sees)
        },
      });
    } catch (err) {
      console.error('Error sending to API:', err);
      return NextResponse.json({
        type: 4,
        data: {
          content: 'Failed to send request to API ❌',
          flags: 64,
        },
      });
    }
  }

  return NextResponse.json({}, { status: 200 });
}
