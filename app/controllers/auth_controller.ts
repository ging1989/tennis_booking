import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { registerValidator } from '#validators/register_validator'

function flashError(session: HttpContext['session'], message: string) {
  session.flash('errors', [{ message }])
}

export default class AuthController {
  async showLogin({ view }: HttpContext) {
    return view.render('pages/auth/login')
  }

  async showRegister({ view }: HttpContext) {
    return view.render('pages/auth/register')
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
      password: data.password,
    })

    return response.redirect().toRoute('login')
  }

  async login({ request, response, session, auth }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])
   
    try {
      const user = await User.verifyCredentials(email, password)

      await auth.use('web').login(user)

      if (user.role === 'admin') {
        return response.redirect('/admin/bookings')
      }

      return response.redirect().toRoute('home')
    } catch {
      flashError(session, 'Email หรือรหัสผ่านไม่ถูกต้อง')
      return response.redirect().back()
    }

  }

  async logout({ response, auth }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect().toRoute('home')
  }
}
