import { Response } from 'express'
import prisma from '../prismaClient'
import { AuthRequest } from '../middleware/auth'
import { TodoStatus } from '@prisma/client'

export const createTodo = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id
        const { title, description, dueDate, status } = req.body
        if (!title || !dueDate)
            return res.status(400).json({ message: 'Title and due date are required.' })

        const todo = await prisma.todo.create({
            data: {
                title,
                description,
                dueDate: new Date(dueDate),
                status: status && Object.values(TodoStatus).includes(status) ? status : TodoStatus.TODO,
                userId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstname: true,
                        lastname: true,
                        createdAt: true
                    }
                }
            }
        })

        res.status(201).json(todo)

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error.' })
    }
}

export const getTodos = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id
        const { status, search, sortBy = 'createdAt', order = 'desc', from, to } = req.query
        const where: any = { userId, isDeleted: false }

        if (status)
            where.status = String(status).toUpperCase()

        if (search) {
            const keyword = String(search).toLowerCase()
            where.OR = [
                { title: { contains: keyword } },
                { description: { contains: keyword } }
            ]
        }
        if (from || to) {
            where.dueDate = {}
            if (from) where.dueDate.gte = new Date(String(from))
            if (to) where.dueDate.lte = new Date(String(to))
        }

        const allowedSort = ['createdAt', 'updatedAt', 'dueDate', 'title', 'status']
        const sortField = allowedSort.includes(String(sortBy)) ? String(sortBy) : 'createdAt'

        const todos = await prisma.todo.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstname: true,
                        lastname: true,
                        createdAt: true
                    }
                }
            },
            orderBy: {
                [sortField]: order === 'asc' ? 'asc' : 'desc'
            }
        })

        res.json(todos)

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error.' })
    }
}

export const getTodo = async (req: AuthRequest, res: Response) => {
    try {
        const id = Number(req.params.id)
        const todo = await prisma.todo.findFirst({
            where: {
                id,
                userId: req.user!.id,
                isDeleted: false
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstname: true,
                        lastname: true,
                        createdAt: true
                    }
                }
            }
        })
        if (!todo)
            return res.status(404).json({ message: 'Not found.' })

        res.json(todo)

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error.' })
    }
}

export const updateTodo = async (req: AuthRequest, res: Response) => {
    try {
        const id = Number(req.params.id)
        const { title, description, dueDate, status } = req.body

        const existing = await prisma.todo.findFirst({
            where: {
                id,
                userId: req.user!.id,
                isDeleted: false
            }
        })
        if (!existing)
            return res.status(404).json({ message: 'Not found.' })

        const updated = await prisma.todo.update({
            where: { id },
            data: {
                title: title ?? existing.title,
                description: description ?? existing.description,
                dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
                status: status && Object.values(TodoStatus).includes(status) ? status : existing.status
            }
        })

        res.json(updated)

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error.' })
    }
}

export const deleteTodo = async (req: AuthRequest, res: Response) => {
    try {
        const id = Number(req.params.id)
        const existing = await prisma.todo.findFirst({
            where: {
                id,
                userId: req.user!.id,
                isDeleted: false
            }
        })
        if (!existing)
            return res.status(404).json({ message: 'Not found.' })

        const deleted = await prisma.todo.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date()
            }
        })

        res.json({ message: `Todo list id ${id} has been deleted.` })

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error.' })
    }
}

export const restoreTodo = async (req: AuthRequest, res: Response) => {
    try {
        const id = Number(req.params.id)
        const existing = await prisma.todo.findFirst({
            where: {
                id,
                userId: req.user!.id,
                isDeleted: true
            }
        })
        if (!existing)
            return res.status(404).json({ message: 'Not found or not deleted.' })

        const restored = await prisma.todo.update({
            where: { id },
            data: {
                isDeleted: false,
                deletedAt: null
            }
        })

        res.json(restored)

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error.' })
    }
}