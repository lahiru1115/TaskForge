import { Request, Response } from 'express';
import { User } from '../models/User';
import { publicUser } from '../utils/serialize';

/**
 * Lists users for the "assign to" dropdown. Any authenticated user may read
 * the minimal public profile (id/name/email/role) of other users.
 */
export async function listUsers(_req: Request, res: Response) {
  const users = await User.find().sort({ name: 1 });
  res.json({ users: users.map(publicUser) });
}
