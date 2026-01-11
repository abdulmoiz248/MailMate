import { NextRequest, NextResponse } from 'next/server';

import crypto from 'crypto';

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!;

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-signature-ed25519');
  const timestamp = req.headers.get('x-signature-timestamp');

  if (!signature || !timestamp) {
    return NextResponse.json({ error: 'Missing signature headers' }, { status: 401 });
  }

  const body = await req.json();

  if (!verifyDiscordRequest(signature, timestamp, body)) {
    return NextResponse.json({ error: 'Invalid request signature' }, { status: 401 });
  }

  const { type, data, member } = body;

  // Respond to Discord PING immediately
  if (type === 1) {
    return NextResponse.json({ type: 1 });
  }

  // Handle /emailresume command
  if (type === 2 && data.name === 'emailresume') {
    try {
      const linkedinPostUrl = data.options[0].value;
      const username = member.user.username;

      console.log(`Received /emailresume command from ${username} with URL: ${linkedinPostUrl}`);
      // Respond to Discord
      return NextResponse.json({
        type: 4, // Channel message with source
        data: {
          content: 'Resume request sent to API ✅',
          flags: 64, // ephemeral message (only visible to user)
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

  // Default fallback
  return NextResponse.json({}, { status: 200 });
}

// OpenSSL 3 compatible Discord signature verification
function verifyDiscordRequest(signature: string, timestamp: string, body: any) {
  const message = Buffer.from(timestamp + JSON.stringify(body));
  const sig = Buffer.from(signature, 'hex');
  const key = Buffer.from(DISCORD_PUBLIC_KEY, 'hex');

  // Use createVerify with sha256 (OpenSSL 3 compatible)
  const verify = crypto.createVerify('sha256');
  verify.update(message);
  verify.end();

  return verify.verify(
    { key, format: 'der', type: 'spki' },
    sig
  );
}
