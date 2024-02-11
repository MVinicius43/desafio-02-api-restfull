import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'crypto'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string(),
      image: z.string().optional(),
    })

    const { name, email, image } = createUserBodySchema.parse(request.body)

    await knex('users').insert({
      id: randomUUID(),
      name,
      email,
      image,
    })

    return reply.status(201).send()
  })
}
