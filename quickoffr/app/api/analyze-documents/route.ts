import { NextRequest, NextResponse } from 'next/server';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse-fork');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const resume = formData.get('resume') as File | null;
    const jobDescription = formData.get('jobDescription') as File | null;

    if (!resume || !jobDescription) {
      return NextResponse.json({ error: 'Missing files' }, { status: 400 });
    }

    // Parse Resume
    const resumeBuffer = Buffer.from(await resume.arrayBuffer());
    const resumeData = await pdf(resumeBuffer);
    const resumeText = resumeData.text;

    // Parse Job Description (could be text or pdf)
    let jdText = '';
    const jdBuffer = Buffer.from(await jobDescription.arrayBuffer());
    if (jobDescription.type === 'application/pdf') {
      const jdData = await pdf(jdBuffer);
      jdText = jdData.text;
    } else {
      jdText = jdBuffer.toString('utf-8');
    }

    return NextResponse.json({
      resumeText,
      jdText,
    });
  } catch (error) {
    console.error('Error analyzing documents:', error);
    return NextResponse.json(
      { error: 'Failed to parse documents' },
      { status: 500 }
    );
  }
}
