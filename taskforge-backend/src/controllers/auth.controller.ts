import { Request, Response } from 'express';
import { User, hashPassword } from '../models/User';
import { LoginEvent } from '../models/LoginEvent';
import { signToken } from '../utils/jwt';
import { publicUser } from '../utils/serialize';
import { ApiError } from '../utils/ApiError';
import { RegisterInput, LoginInput } from '../validators/auth.validator';

const DEMO_EMAILS = new Set([
  'admin@taskforge.com',
  'jane@taskforge.com',
  'john@taskforge.com',
  'sarah@taskforge.com',
]);

const COOKIE_NAME = 'tf_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

function setAuthCookie(res: Response, token: string) {
  const prod = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: prod,
    sameSite: prod ? 'none' : 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body as RegisterInput;

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict('Email already in use');
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({ name, email, passwordHash });

  const token = signToken({ sub: user._id.toString(), role: user.role });
  setAuthCookie(res, token);
  res.status(201).json({ user: publicUser(user) });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as LoginInput;

  // passwordHash has select:false, so request it explicitly.
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = signToken({ sub: user._id.toString(), role: user.role });
  setAuthCookie(res, token);

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ?? req.ip ?? 'unknown';
  LoginEvent.create({
    email: user.email,
    name: user.name,
    role: user.role,
    ip,
    userAgent: req.headers['user-agent'] ?? 'unknown',
    isDemoAccount: DEMO_EMAILS.has(user.email),
  }).catch(() => {});

  res.json({ user: publicUser(user) });
}

export async function logout(_req: Request, res: Response) {
  const prod = process.env.NODE_ENV === 'production';
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: prod,
    sameSite: prod ? 'none' : 'strict',
    path: '/',
  });
  res.json({ message: 'Logged out' });
}

export async function me(req: Request, res: Response) {
  res.json({ user: publicUser(req.user!) });
}
