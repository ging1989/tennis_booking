import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class ShareAuthMiddleware {
  async handle({ session, view }: HttpContext, next: NextFn) {
    view.share({ sessionUser: session.get('user') ?? null })
    await next()
  }
}
