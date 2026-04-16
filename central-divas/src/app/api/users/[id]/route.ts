import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, hashPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, name, email, whatsapp, avatar, type, status, password } = body;

    if (payload.type !== 'SUPERADMIN' && payload.type !== 'ADMIN' && payload.userId !== userId) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (type && (payload.type === 'SUPERADMIN')) updateData.type = type;
    if (status && (payload.type === 'SUPERADMIN' || payload.type === 'ADMIN')) updateData.status = status;
    if (password) updateData.password = hashPassword(password);

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type,
        status: user.status,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}