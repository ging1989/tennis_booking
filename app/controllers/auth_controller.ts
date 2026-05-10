import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import { registerValidator } from '#validators/register_validator'

export default class AuthController {
  async showLogin({ view }: HttpContext) {
    return view.render('pages/login')
  }

  async showRegister({ view }: HttpContext) {
    return view.render('pages/register')
  }

  async register({ request, response, session }: HttpContext) {
    const data = await request.validateUsing(registerValidator)
    const existingUser = await User.findBy('email', data.email)

    if (existingUser) {
      session.flash('errors', [{ message: 'Email นี้มีผู้ใช้งานแล้ว' }])
      return response.redirect().back()
    }

    await User.create({
      fullName: data.full_name,
      email: data.email,
      phone: data.phone,
      password: await hash.make(data.password),
    })

    return response.redirect().toRoute('login')
  }

  async login({ request, response, session }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])
    const user = await User.findBy('email', email)

    if (!user) {
      session.flash('errors', [{ message: 'ไม่พบบัญชีผู้ใช้งานนี้' }])
      return response.redirect().back()
    }

    const passwordIsCorrect = await hash.verify(user.password, password)

    if (!passwordIsCorrect) {
      session.flash('errors', [{ message: 'รหัสผ่านไม่ถูกต้อง' }])
      return response.redirect().back()
    }

    session.put('user', {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
    })

    return response.redirect().toRoute('home')
  }

  async logout({ session, response }: HttpContext) {
    session.forget('user')
    return response.redirect().toRoute('home')
  }
}
