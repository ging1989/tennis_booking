import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'booking_slots'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('booking_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('bookings')
        .onDelete('CASCADE')
      table
        .integer('court_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('courts')
        .onDelete('CASCADE')
      table.date('booking_date').notNullable()
      table.time('slot_start').notNullable()
      table.timestamps(true, true)

      table.unique(['court_id', 'booking_date', 'slot_start'], 'booking_slots_unique_slot')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
