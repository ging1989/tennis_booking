import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import hash from '@adonisjs/core/services/hash'

export default class extends BaseSeeder {
  async run() {
    await User.createMany([
      {
        fullName: 'admin01',
        email: 'admin01@tennis.com',
        password: await hash.make('AdminTennis@01'),
        phone: '0822482510',
        role: 'admin',
      },
      {
        fullName: 'Ganokporn Jongsutjarittum',
        email: 'ganokporn@testmember.com',
        password: await hash.make('Member@1234'),
        phone: '0922239865',
        role: 'member',
        memberType: 'bronze',
        points: 25
      },
      {
        fullName: 'Thakwan Kongrojanakorn',
        email: 'thakwan@testmember.com',
        password: await hash.make('Member@1234'),
        phone: '0953708500',
        role: 'member',
        memberType: 'silver',
        points: 150,
      },
      {
        fullName: 'Natalee Sawasdee',
        email: 'natalee@testmember.com',
        password: await hash.make('Member@1234'),
        phone: '0827907900',
        role: 'member',
        memberType: 'gold',
        points: 200,
      }
    ])
  }
}