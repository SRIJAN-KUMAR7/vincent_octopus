import { NextResponse } from 'next/server';

export async function GET() {
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!agentId || !apiKey) {
    return NextResponse.json(
      { error: 'Missing ElevenLabs configuration' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API Error:', {
        status: response.status,
        body: errorText,
      });
      throw new Error(`Failed to get signed URL: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Signed URL generated successfully');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching signed URL:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
