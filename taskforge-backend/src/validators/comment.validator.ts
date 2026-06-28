import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const addCommentSchema = z.object({
  body: z.string().trim().min(1, 'Comment cannot be empty').max(5000),
});

export const commentParamsSchema = z.object({
  id: objectId,
  commentId: objectId,
});

export type AddCommentInput = z.infer<typeof addCommentSchema>;
