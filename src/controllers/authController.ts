import { Request, Response } from 'express'
import prisma from '../prismaClient'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS || 10)
const JWT_SECRET = process.env.JWT_SECRET || 'jwt-sample'

export const register = async (req: Request, res: Response) => {
    try {
        const { firstname, lastname, email, password, confirm_password } = req.body
        if (!firstname || !lastname || !email || !password || !confirm_password)
            return res.status(400).json({ message: 'First Name, Last Name, Email, Password, Confirm Password are required.' })

        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) 
            return res.status(400).json({ message: 'Email already in use.' })
        if (password !== confirm_password) 
            return res.status(400).json({ message: 'Passwords do not match.' })

        const hash = await bcrypt.hash(password, SALT_ROUNDS)
        const user = await prisma.user.create({
            data: {
                email,
                password: hash,
                firstname,
                lastname
            }
        })

        const token = jwt.sign({ userId: user.id, }, JWT_SECRET, { expiresIn: '7d' })
        res.json({
            user: {
                id: user.id,
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname
            },
            token
        })

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error.' })
    }
}

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body
        if (!email || !password) 
            return res.status(400).json({ message: 'Email and password are required.' })

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || user.isDeleted) 
            return res.status(400).json({ message: 'Invalid email or password.' })

        const match = await bcrypt.compare(password, user.password)
        if (!match) 
            return res.status(400).json({ message: 'Invalid email or password.'})

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
        res.json({
            user: {
                id: user.id,
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname
            },
            token
        })

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error.' })
    }
}