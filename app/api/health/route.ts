import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Basic health check
    return NextResponse.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      service: "Books App"
    })
  } catch (err) {
    console.error("Health check failed:", err)
    return NextResponse.json(
      { status: "error", message: "Service unavailable" }, 
      { status: 503 }
    )
  }
}