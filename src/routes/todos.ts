import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { createTodo, getTodos, getTodo, updateTodo, deleteTodo, restoreTodo } from '../controllers/todoController'

const router = Router()
router.use(authenticate)
router.post('/', createTodo)
router.get('/', getTodos)
router.get('/:id', getTodo)
router.put('/:id', updateTodo)
router.delete('/:id', deleteTodo)
router.post('/:id/restore', restoreTodo)

export default router