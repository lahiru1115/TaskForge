import { Request, Response } from 'express';
import { User, hashPassword } from '../models/User';
import { signToken } from '../utils/jwt';
import { publicUser } from '../utils/serialize';
import { ApiError } from '../utils/ApiError';
import { RegisterInput, LoginInput } from '../validators/auth.validator';

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body as RegisterInput;

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict('Email already in use');
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({ name, email, passwordHash });

  const token = signToken({ sub: user._id.toString(), role: user.role });
  res.status(201).json({ token, user: publicUser(user) });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as LoginInput;

  // passwordHash has select:false, so request it explicitly.
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = signToken({ sub: user._id.toString(), role: user.role });
  res.json({ token, user: publicUser(user) });
}

export async function me(req: Request, res: Response) {
  res.json({ user: publicUser(req.user!) });
}
