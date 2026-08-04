import { Request, Response } from 'express';
import { User } from '../models/User';
import { publicUser } from '../utils/serialize';
import { ApiError } from '../utils/ApiError';
import { UpdateProfileInput, ChangePasswordInput } from '../validators/auth.validator';
import { hashPassword } from '../models/User';

export async function updateMe(req: Request, res: Response) {
  const { name, email } = req.body as UpdateProfileInput;

  if (email !== req.user!.email) {
    const conflict = await User.findOne({ email, _id: { $ne: req.user!._id } });
    if (conflict) throw ApiError.conflict('Email already in use');
  }

  const updated = await User.findByIdAndUpdate(
    req.user!._id,
    { name, email },
    { new: true, runValidators: true },
  );

  if (!updated) throw ApiError.notFound('User not found');

  res.json({ user: publicUser(updated) });
}

export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body as ChangePasswordInput;

  const user = await User.findById(req.user!._id).select('+passwordHash');
  if (!user) throw ApiError.notFound('User not found');

  const valid = await user.comparePassword(currentPassword);
  if (!valid) throw ApiError.badRequest('Current password is incorrect');

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  res.json({ message: 'Password changed successfully' });
}
