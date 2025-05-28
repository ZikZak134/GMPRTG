import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check Python API health if available
    let pythonApiStatus = "unknown"
    const pythonApiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || "http://localhost:5000"

    try {
      const response = await fetch(`${pythonApiUrl}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      })

      if (response.ok) {
        const data = await response.json()
        pythonApiStatus = data.status === "ok" ? "healthy" : "unhealthy"
      } else {
        pythonApiStatus = "unhealthy"
      }
    } catch (error) {
      pythonApiStatus = "unavailable"
    }

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      pythonApi: pythonApiStatus,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
