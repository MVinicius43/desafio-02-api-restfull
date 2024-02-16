import { FastifyInstance } from 'fastify'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'crypto'

export async function mealsRoutes(app: FastifyInstance) {
  app.post(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const createMealsBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        mealType: z.enum(['on_diet_meals', 'off_diet_meals']),
      })

      const { name, description, mealType } = createMealsBodySchema.parse(
        request.body,
      )

      const { sessionId } = request.cookies

      await knex('meals')
        .insert({
          id: randomUUID(),
          name,
          description,
          meal_type: mealType,
          session_id: sessionId,
        })
        .where({
          session_id: sessionId,
        })

      return reply.status(201).send()
    },
  )

  app.get('/', { preHandler: [checkSessionIdExists] }, async (request) => {
    const { sessionId } = request.cookies

    const meals = await knex('meals').where('session_id', sessionId).select()

    return { meals }
  })

  app.get('/:id', { preHandler: [checkSessionIdExists] }, async (request) => {
    const listMealParamSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = listMealParamSchema.parse(request.params)

    const { sessionId } = request.cookies

    const meal = await knex('meals')
      .where({
        session_id: sessionId,
        id,
      })
      .select()

    return { meal }
  })

  app.put('/', { preHandler: checkSessionIdExists }, async (request) => {
    const editMealBodySchema = z.object({
      id: z.string().uuid(),
      name: z.string().optional(),
      description: z.string().optional(),
      mealType: z.enum(['on_diet_meals', 'off_diet_meals']).optional(),
    })

    const { id, name, description, mealType } = editMealBodySchema.parse(
      request.body,
    )

    const { sessionId } = request.cookies

    await knex('meals')
      .where({
        id,
        session_id: sessionId,
      })
      .update({
        name,
        description,
        mealType,
      })
  })

  app.delete(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request) => {
      const deleteMealParamSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = deleteMealParamSchema.parse(request.params)

      const { sessionId } = request.cookies

      await knex('meals')
        .where({
          id,
          session_id: sessionId,
        })
        .delete()
    },
  )
}
