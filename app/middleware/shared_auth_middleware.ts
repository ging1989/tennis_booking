import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class ShareAuthMiddleware {
  async handle({ auth, view }: HttpContext, next: NextFn) {
    await auth.check()
    view.share({ sessionUser: auth.user ?? null })
    await next()
  }
}
