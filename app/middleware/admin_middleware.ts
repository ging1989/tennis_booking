import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AdminMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    await auth.authenticate()

    if (auth.user?.role !== 'admin') {
      return response.redirect('/')
    }

    return next()
  }
}