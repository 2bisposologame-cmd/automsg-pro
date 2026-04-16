import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const posts = await prisma.post.findMany({
      include: {
        user: {
          select: { name: true },
        },
        completions: true,
      },
      orderBy: { scheduledAt: 'desc' },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json({ error: 'Erro ao buscar posts' }, { status: 500 });
  }
}

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

    if (payload.type !== 'SUPERADMIN' && payload.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const body = await request.json();
    const { instagramUrl, caption, imageUrl, scheduledAt } = body;

    if (!instagramUrl) {
      return NextResponse.json(
        { error: 'URL do Instagram é obrigatória' },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        instagramUrl,
        caption: caption || '',
        imageUrl: imageUrl || '',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        userId: payload.userId,
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'Erro ao criar post' }, { status: 500 });
  }
}