import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'crypto'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string(),
      image: z.string().optional(),
    })

    const { name, email, image } = createUserBodySchema.parse(request.body)

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('users').insert({
      id: randomUUID(),
      name,
      email,
      image,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })

  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const user = await knex('users').where('session_id', sessionId).select()

      return { user }
    },
  )

  app.put(
    '/metrics/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const changeRegisteredMealsParamsSchema = z.object({
        id: z.string().uuid(),
      })
      const changeMealsTypeBodySchema = z.object({
        mealType: z.enum(['on_diet_meals', 'off_diet_meals']),
      })

      const { id } = changeRegisteredMealsParamsSchema.parse(request.params)
      const { mealType } = changeMealsTypeBodySchema.parse(request.body)

      const { sessionId } = request.cookies

      await knex('users')
        .where({
          id,
          session_id: sessionId,
        })
        .first()
        .increment('registered_meals', 1)
        .increment(mealType, 1)
        .then(async () => {
          await knex('users')
            .where({
              id,
              session_id: sessionId,
            })
            .update('best_on_diet_meals_sequence', 0)
            .whereRaw(mealType === 'off_diet_meals')
        })

      await knex('users')
        .where({
          id,
          session_id: sessionId,
        })
        .increment('best_on_diet_meals_sequence', 2)
        .where('last_meal_type', 'on_diet_meals')
        .andWhereRaw(mealType === 'on_diet_meals')

      await knex('users')
        .where({
          id,
          session_id: sessionId,
        })
        .update({
          last_meal_type: mealType,
        })

      return reply.status(200).send()
    },
  )
}
