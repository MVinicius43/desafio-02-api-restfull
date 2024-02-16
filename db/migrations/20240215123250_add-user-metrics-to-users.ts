import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.integer('registered_meals').defaultTo(0)
    table.integer('on_diet_meals').defaultTo(0)
    table.integer('off_diet_meals').defaultTo(0)
    table.integer('best_on_diet_meals_sequence').defaultTo(0)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('registered_meals')
    table.dropColumn('on_diet_meals')
    table.dropColumn('off_diet_meals')
    table.dropColumn('best_on_diet_meals_sequence')
  })
}
