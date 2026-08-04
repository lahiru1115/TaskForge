import { IUser } from '../models/User';
import { IWorkspace } from '../models/Workspace';
import { IWorkspaceMember } from '../models/WorkspaceMember';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: IUser;
      validatedQuery?: unknown;
      workspace?: IWorkspace;
      membership?: IWorkspaceMember;
    }
  }
}

export {};
