import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { v7 as uuidv7 } from 'uuid'
import { cookies } from 'next/headers'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const error = NextResponse.error()
  console.log('middleware', error.statusText)
  const userKey = uuidv7()
  if (!cookies().get('userKey')?.value) {
    response.cookies.set('userKey', userKey)
  }
  return response
}
