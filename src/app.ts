import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import todosRoutes from './routes/todos'

dotenv.config()

const app = express()
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/todos', todosRoutes)

app.get('/', (req, res) => {
    res.json({
        ok: true,
        message: 'TodoList API running.'
    })
})

export default app