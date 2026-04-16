import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
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

    const body = await request.json();
    const { taskId, postId } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: 'ID da tarefa é obrigatório' },
        { status: 400 }
      );
    }

    const existing = await prisma.taskCompletion.findFirst({
      where: {
        userId: payload.userId,
        taskId,
        postId: postId || null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Tarefa já concluída' },
        { status: 400 }
      );
    }

    const completion = await prisma.taskCompletion.create({
      data: {
        userId: payload.userId,
        taskId,
        postId: postId || null,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ completion });
  } catch (error) {
    console.error('Complete task error:', error);
    return NextResponse.json({ error: 'Erro ao concluir tarefa' }, { status: 500 });
  }
}