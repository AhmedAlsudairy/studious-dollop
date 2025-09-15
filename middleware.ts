import authConfig from "@/auth.config"
import NextAuth from "next-auth"
import type { NextRequest } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req: NextRequest) => {
  // Add any custom middleware logic here
  console.log("Middleware running for:", req.nextUrl.pathname)
})

export const config = {
  // Match routes that need authentication
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
}