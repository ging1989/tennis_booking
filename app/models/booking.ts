import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Booking extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare bookingNo: string

  @column()
  declare customerName: string

  @column()
  declare customerPhone: string

  @column()
  declare customerEmail: string

  @column()
  declare customerType: 'guest' | 'member'

  @column()
  declare courtId: number

  @column()
  declare userId: number | null

  @column()
  declare bookingDate: string

  @column()
  declare timeStart: string

  @column()
  declare timeEnd: string

  @column()
  declare totalPrice: number

  @column()
  declare discount: number

  @column()
  declare status: 'pending' | 'confirmed' | 'cancelled'

  @column()
  declare paymentSlip: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}