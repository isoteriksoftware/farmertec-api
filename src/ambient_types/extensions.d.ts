declare namespace Express {
  export interface Request {
    auth?: any,
    user?: any,
    files?: any,
  }
}