import { IUser } from '../models/User';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: IUser;
      validatedQuery?: unknown;
    }
  }
}

export {};
