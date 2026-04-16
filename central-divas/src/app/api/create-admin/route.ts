import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    if (payload.type !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Apenas SUPERADMIN pode criar administradores' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, type, status } = body;

    const user = await prisma.user.create({
      data: {
        name: name || 'Admin',
        email,
        password: hashPassword(password),
        type: type || 'ADMIN',
        status: status || 'ACTIVE',
        whatsapp: '',
      },
    });

    return NextResponse.json({ 
      message: 'Usuário criado!',
      user: { id: user.id, email: user.email, type: user.type, status: user.status }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}