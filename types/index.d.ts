import { IUser } from '../interfaces/IUser';

declare module 'express-serve-static-core' {
  interface Request {
    user?: IUser;
  }
}