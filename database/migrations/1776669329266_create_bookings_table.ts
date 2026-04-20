import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'bookings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('customer_name').notNullable()
      table.string('customer_phone').notNullable()
      table.string('customer_email').notNullable()
      table.enum('customer_type', ['guest', 'member']).defaultTo('guest')
      table.integer('court_id').unsigned().references('id').inTable('courts').onDelete('CASCADE')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL').nullable
      table.date('booking_date').notNullable()
      table.time('time_start').notNullable()
      table.time('time_end').notNullable()
      table.integer('total_price').notNullable()
      table.integer('discount').defaultTo(0)
      table.enum('status', ['pending', 'confirmed', 'cancelled']).defaultTo('pending')
      table.timestamps(true, true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}