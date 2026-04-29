import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()
  
  const response = NextResponse.json({})
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.delete(name)
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  // Retorna o response com os cookies de sessão
  response.headers.set('Content-Type', 'application/json')
  return new NextResponse(
    JSON.stringify({ user: data.user }),
    {
      status: 200,
      headers: response.headers,
    }
  )
}
