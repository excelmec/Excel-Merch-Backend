import { Request, Response, NextFunction } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { DecodedToken } from '../types';
import { JWT_SECRET_KEY } from '../utils/env';
import { UnauthorizedError } from '../utils/error';

  
const userValidateToken = (req: Request, res: Response, next: NextFunction): void => {

    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
        throw new UnauthorizedError('Missing authorization header');
    }

    const tokenParts = authorizationHeader.split(' ');

    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        throw new UnauthorizedError ('Invalid authorization header format');
    }

    const token = tokenParts[1];

    try {
        const decodedToken = jwt.verify(token, JWT_SECRET_KEY) as DecodedToken;

        // if (!decodedToken.role.includes('User')) {
        //     res.status(403).json({ error: 'Unauthorized: Only Admins can change logostatus' });
        //     return;
        // }

        req.decodedToken = decodedToken;

        next();
    } catch (err) {
        if (err instanceof TokenExpiredError) {
            throw new UnauthorizedError('Token expired');
        }

        throw new UnauthorizedError('Invalid token');
    }
}

export { userValidateToken };