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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const userCount = await prisma.user.count({
      where: { status: 'ACTIVE' },
    });

    const pendingCount = await prisma.user.count({
      where: { status: 'PENDING' },
    });

    const taskCompletions = await prisma.taskCompletion.findMany({
      where: {
        completedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const completedToday = taskCompletions.filter(t => t.status === 'COMPLETED').length;
    const totalTasks = await prisma.task.count({ where: { active: true } });
    const potentialTasks = userCount * totalTasks;

    const postsToday = await prisma.post.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const dashboard = {
      activeUsers: userCount,
      pendingUsers: pendingCount,
      completedTasks: completedToday,
      totalTasks: potentialTasks,
      postsToday,
      completionRate: potentialTasks > 0 ? Math.round((completedToday / potentialTasks) * 100) : 0,
    };

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Erro ao buscar dashboard' }, { status: 500 });
  }
}