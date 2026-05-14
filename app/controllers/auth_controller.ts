import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import { registerValidator } from '#validators/register_validator'

const USER_SESSION_KEY = 'user'

type LoginForm = {
  email: string
  password: string
}

function flashError(session: HttpContext['session'], message: string) {
  session.flash('errors', [{ message }])
}

function getUserSession(user: User) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
  }
}

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
      flashError(session, 'Email นี้มีผู้ใช้งานแล้ว')
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
    const { email, password } = request.only(['email', 'password']) as LoginForm
    const user = await User.findBy('email', email)

    if (!user) {
      flashError(session, 'ไม่พบบัญชีผู้ใช้งานนี้')
      return response.redirect().back()
    }

    const passwordIsCorrect = await hash.verify(user.password, password)

    if (!passwordIsCorrect) {
      flashError(session, 'รหัสผ่านไม่ถูกต้อง')
      return response.redirect().back()
    }

    session.put(USER_SESSION_KEY, getUserSession(user))

    return response.redirect().toRoute('home')
  }

  async logout({ session, response }: HttpContext) {
    session.forget(USER_SESSION_KEY)
    return response.redirect().toRoute('home')
  }
}
