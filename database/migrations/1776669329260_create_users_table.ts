import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('full_name').notNullable()
      table.string('email').notNullable().unique()
      table.string('password').notNullable()
      table.string('phone').notNullable()
      table.enum('role', ['member', 'admin']).defaultTo('member').nullable()
      table.enum('member_type',['bronze', 'silver', 'gold']).defaultTo('bronze')
      table.integer('points').defaultTo(0).nullable()
      table.timestamps(true, true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}