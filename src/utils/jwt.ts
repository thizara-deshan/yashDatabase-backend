import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

const signOptions: SignOptions = {
  expiresIn: (process.env.JWT_EXPIRES_IN || "1d") as SignOptions["expiresIn"],
};

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, signOptions);
};

export const verifyJwt = (token: string): JwtPayload | string => {
  return jwt.verify(token, JWT_SECRET);
};
