import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Simple doctor keys - just name and key
const DOCTOR_KEYS = {
  'HEAL_CHIRAG_A7K9X2M8': 'Chirag',
  'HEAL_DEEPAK_P1N4Q6R3': 'Dr. Deepak',
  'HEAL_ADHYA_K8L2M5N9': 'Dr. Adhya',
  'HEAL_TANMAY_B5C7D9E1': 'Dr. Tanmay'
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Validate API key
    const doctorName = DOCTOR_KEYS[apiKey as keyof typeof DOCTOR_KEYS];

    if (!doctorName) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        doctorName,
        apiKey,
        loginTime: new Date().toISOString()
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const response = NextResponse.json({
      success: true,
      doctor: {
        name: doctorName
      }
    });

    // Set token as httpOnly cookie (secure in production)
    response.cookies.set({
      name: 'authToken',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours in seconds
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}