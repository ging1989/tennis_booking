import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Court from '#models/court'

export default class extends BaseSeeder {
  async run() {
    await Court.createMany([
    {courtName: 'Court 1', pricePerHour: 250, status: 'available'},
    {courtName: 'Court 2', pricePerHour: 250, status: 'available'},
    {courtName: 'Court 3', pricePerHour: 250, status: 'available'},
    {courtName: 'Court 4', pricePerHour: 250, status: 'available'},
    {courtName: 'Court 5', pricePerHour: 250, status: 'available'},
    {courtName: 'Court 6', pricePerHour: 250, status: 'available'},
    ])
  }
}