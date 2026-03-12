// api/demo-login.ts
// POST /api/demo-login — create a temporary demo user and return credentials.

import { randomBytes } from 'node:crypto'
import { withCors, badRequest, serverError, type Req, type Res } from './_utils.js'
import { checkRateLimit, standardRateLimit } from '../lib/rateLimit.js'
import { supabaseAdmin } from '../lib/supabase.js'

function getClientKey(req: Req): string {
  const header = req.headers['x-forwarded-for']
  const ip = Array.isArray(header) ? header[0] : header
  return `demo:${(ip || 'unknown').split(',')[0].trim()}`
}

function makeEmail(): string {
  const token = randomBytes(10).toString('hex')
  return `demo+${token}@example.com`
}

function makePassword(): string {
  return randomBytes(18).toString('base64url')
}

export default withCors(async (req: Req, res: Res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const key = getClientKey(req)
  if (!await checkRateLimit(res, key, standardRateLimit)) return

  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const email = makeEmail()
      const password = makePassword()

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { demo: true },
      })

      if (error) {
        if (error.message?.includes('already registered')) continue
        return badRequest(res, error.message)
      }

      if (!data?.user) {
        return badRequest(res, 'Could not create demo user')
      }

      return res.status(200).json({ email, password })
    }

    return badRequest(res, 'Could not generate demo user')
  } catch (err) {
    serverError(res, err)
  }
})
