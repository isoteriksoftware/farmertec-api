import { Request } from 'express';
import { UserRole } from '../util/enums';

export default (req: Request, res: any, next: any) => {
  if (req.user.role !== UserRole.ADMIN)
    return res.failUnauthorized('Unauthorized to access this route');

  next();
};