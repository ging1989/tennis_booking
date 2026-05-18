import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

const USERS = [
  {
    fullName: 'admin01',
    email: 'admin01@tennis.com',
    password: 'AdminTennis@01',
    phone: '0822482510',
    role: 'admin',
  },
  {
    fullName: 'Anan Wongchai',
    email: 'anan.w@tennis.com',
    password: 'AnanTennis@01',
    phone: '0812345678',
    role: 'member',
  },
  {
    fullName: 'Krittin Suksawat',
    email: 'krittin.s@tennis.com',
    password: 'KrittinTennis@01',
    phone: '0823456789',
    role: 'member',
  },
  {
    fullName: 'Nattapong Charoenkit',
    email: 'nattapong.c@tennis.com',
    password: 'NattapongTennis@01',
    phone: '0834567890',
    role: 'member',
  },
  {
    fullName: 'Piyawat Rattanakul',
    email: 'piyawat.r@tennis.com',
    password: 'PiyawatTennis@01',
    phone: '0845678901',
    role: 'member',
  },
  {
    fullName: 'Thanawat Boonmee',
    email: 'thanawat.b@tennis.com',
    password: 'ThanawatTennis@01',
    phone: '0856789012',
    role: 'member',
  },
  {
    fullName: 'Supakorn Limcharoen',
    email: 'supakorn.l@tennis.com',
    password: 'SupakornTennis@01',
    phone: '0867890123',
    role: 'member',
  },
  {
    fullName: 'Chayut Phromsri',
    email: 'chayut.p@tennis.com',
    password: 'ChayutTennis@01',
    phone: '0878901234',
    role: 'member',
  },
  {
    fullName: 'Narissara Kanjanawan',
    email: 'narissara.k@tennis.com',
    password: 'NarissaraTennis@01',
    phone: '0889012345',
    role: 'member',
  },
  {
    fullName: 'Pimchanok Saelim',
    email: 'pimchanok.s@tennis.com',
    password: 'PimchanokTennis@01',
    phone: '0890123456',
    role: 'member',
  },
  {
    fullName: 'Waranya Techakul',
    email: 'waranya.t@tennis.com',
    password: 'WaranyaTennis@01',
    phone: '0801234567',
    role: 'member',
  },
]

export default class extends BaseSeeder {
  async run() {
    for (const user of USERS) {
      await User.updateOrCreate({ email: user.email }, user)
    }
  }
}
