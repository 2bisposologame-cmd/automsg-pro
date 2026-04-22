import { supabase } from '../../lib/supabase.js';
import { validatePayload, loginSchema, signupSchema } from '../../lib/schemas.js';
import { createLogger } from '../../lib/logger.js';

const logger = createLogger('AuthAPI');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return handleAuth(req, res);
  } else if (req.method === 'GET') {
    return handleSession(req, res);
  }
  
  res.setHeader('Allow', ['POST', 'GET']);
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleSession(req, res) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      ...profile,
    },
    session: { access_token: token },
  });
}

async function handleAuth(req, res) {
  const { action } = req.body;
  
  if (action === 'signup') {
    return handleSignup(req, res);
  } else if (action === 'login') {
    return handleLogin(req, res);
  } else if (action === 'logout') {
    return handleLogout(req, res);
  } else if (action === 'reset') {
    return handlePasswordReset(req, res);
  }
  
  return res.status(400).json({ error: 'Invalid action' });
}

async function handleSignup(req, res) {
  const validation = validatePayload(signupSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const { email, password, fullName, phone } = validation.data;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || '',
        },
      },
    });

    if (error) {
      logger.error('Signup error', { email, error: error.message });
      
      if (error.message.includes('already registered')) {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
      }
      
      return res.status(400).json({ error: error.message });
    }

    logger.info('User signed up', { userId: data.user?.id, email });

    return res.status(200).json({
      message: 'Cadastro realizado! Verifique seu email para confirmar.',
      user: data.user,
    });
  } catch (err) {
    logger.error('Signup exception', { error: err.message });
    return res.status(500).json({ error: 'Erro interno.' });
  }
}

async function handleLogin(req, res) {
  const validation = validatePayload(loginSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const { email, password } = validation.data;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error('Login error', { email, error: error.message });
      
      if (error.message.includes('Invalid login')) {
        return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      }
      
      if (error.message.includes('Email not confirmed')) {
        return res.status(401).json({ error: 'E-mail ainda não confirmado.' });
      }
      
      return res.status(401).json({ error: error.message });
    }

    logger.info('User logged in', { userId: data.user?.id, email });

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return res.status(200).json({
      user: {
        id: data.user.id,
        email: data.user.email,
        ...profile,
      },
      session: data.session,
    });
  } catch (err) {
    logger.error('Login exception', { error: err.message });
    return res.status(500).json({ error: 'Erro interno.' });
  }
}

async function handleLogout(req, res) {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    await supabase.auth.signOut();
  }
  
  return res.status(200).json({ message: 'Logged out' });
}

async function handlePasswordReset(req, res) {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email é obrigatório' });
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({
    message: 'Email de recuperação enviado!',
  });
}