import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // 👈 was "middleware"
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Protect /app routes
  if (path.startsWith("/app") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logged-in users shouldn't see login/signup
  if ((path === "/login" || path === "/signup") && user) {
    return NextResponse.redirect(new URL("/app/workspaces", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/login", "/signup"],
};
