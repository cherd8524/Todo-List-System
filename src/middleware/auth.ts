import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface JwtPayload { userId: number }
export interface AuthRequest extends Request { user?: { id: number } }

const JWT_SECRET = process.env.JWT_SECRET || 'jwt-sample'

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization
    if (!authHeader)
        return res.status(401).json({ message: 'No token provided.' })

    const [scheme, token] = authHeader.split(' ')
    if (!/^Bearer$/i.test(scheme))
        return res.status(401).json({ message: 'Token malformatted.' })

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
        req.user = { id: decoded.userId }
        next()

    } catch (err) {
        console.error(err)
        res.status(401).json({ message: 'Token invalid.' })
    }
}