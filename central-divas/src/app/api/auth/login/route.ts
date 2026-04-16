import { NextRequest, NextResponse } from 'next/server';
import { comparePassword, generateToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    if (user.status !== 'ACTIVE') {
      const statusMessages: Record<string, string> = {
        PENDING: 'Sua conta está pendente. Aguarde aprovação.',
        INACTIVE: 'Sua conta foi desativada. Entre em contato com o admin.',
        REJECTED: 'Sua conta foi rejeitada. Entre em contato com o admin.',
      };
      return NextResponse.json(
        { error: statusMessages[user.status] || 'Conta inativa' },
        { status: 403 }
      );
    }

    const isValid = comparePassword(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      type: user.type,
      name: user.name,
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
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    );
  }
}