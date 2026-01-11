import { NextRequest, NextResponse } from 'next/server';
import { verifyKey } from 'discord-interactions';
import fetch from 'node-fetch';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!;

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const signature = req.headers.get('x-signature-ed25519')!;
  const timestamp = req.headers.get('x-signature-timestamp')!;

  const isValid = await verifyKey(rawBody, signature, timestamp, DISCORD_PUBLIC_KEY);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid request signature' }, { status: 401 });
  }

  const body = JSON.parse(rawBody);
  const { type, data, member } = body;

  if (type === 1) return NextResponse.json({ type: 1 });

  if (type === 2 && data.name === 'emailresume') {
    try {
      const linkedinPostUrl = data.options[0].value;
      const username = member.user.username;

      console.log(`Received /emailresume command from ${username} for URL: ${linkedinPostUrl}`);

    //   // Fetch LinkedIn post HTML
    //   const res = await fetch(linkedinPostUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    //   const html = await res.text();

    //   // Extract email from post content
    //   const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/);
    const emailMatch = linkedinPostUrl
      if (!emailMatch) throw new Error('No email found in post');

      const hrEmail = emailMatch
      console.log('Extracted HR Email:', hrEmail);

      // Nodemailer setup (using Gmail for example)
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASS!,
        },
      });

      
      const mailOptions = {
        from: process.env.SMTP_USER!,
        to: hrEmail,
        subject: `Resume of Abdul Moiz `,
      text: `Hello,

Please find attached my resume for consideration.

Dear Hiring Manager,

I’m Abdul Moiz, a programmer and freelancer with hands-on experience building real-world applications, not just classroom projects. I work across modern web stacks and backend systems, and I’m comfortable taking ownership of features end to end.

I’ve worked with technologies like Next.js, NestJS, TypeScript, MongoDB, SQL, and Python, and I’ve built full-stack applications involving authentication, APIs, real-time features, and clean UI using Tailwind CSS. I care about writing code that actually scales, not quick hacks that fall apart later.

What sets me apart is that I don’t just “follow tutorials.” I understand how systems work, I debug aggressively, and I learn fast when dropped into new codebases. Whether it’s frontend logic, backend APIs, or integrating ML services, I adapt and deliver.

I’m looking for an opportunity where I can contribute, grow, and build things that matter. I’d love to discuss how my skills can add value to your team.

Best regards,
Abdul Moiz`
,  attachments: [
          {
            filename: 'resume.pdf',
            path: '/resume.pdf',
          },
        ],
      };

      await transporter.sendMail(mailOptions);

      return NextResponse.json({
        type: 4,
        data: { content: `Resume sent successfully to ${hrEmail} ✅`, flags: 64 },
      });
    } catch (err) {
      console.error('Error sending resume:', err);
      return NextResponse.json({
        type: 4,
        data: { content: `Failed to send resume ❌: ${err}`, flags: 64 },
      });
    }
  }

  return NextResponse.json({}, { status: 200 });
}
