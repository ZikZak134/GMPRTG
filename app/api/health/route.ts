import { NextResponse } from "next/server"

const HEALTH_API_VERSION = "2.1.3" // Increment version

console.log(`🔵 HEALTH API MODULE LOADED (v${HEALTH_API_VERSION}) - Timestamp: ${new Date().toISOString()}`)

export async function GET() {
  console.log(`🔍 Health check requested (v${HEALTH_API_VERSION}) - ATTEMPTING BASIC RESPONSE`)

  try {
    // STEP 1: Try the most basic possible valid response.
    // If this works, the problem is in the subsequent logic.
    // If this itself fails with "Unknown error", the issue is very low-level.
    // return NextResponse.json({ status: "bare_minimum_ok", version: HEALTH_API_VERSION, timestamp: new Date().toISOString() });

    // STEP 2: If STEP 1 worked, uncomment the rest and comment out STEP 1.
    // This is the original logic.
    let pythonApiStatus = "unavailable"
    let pythonApiError = null
    const pythonApiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || "http://localhost:5000"

    try {
      console.log(`🔗 Checking Python API at: ${pythonApiUrl} (v${HEALTH_API_VERSION})`)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`${pythonApiUrl}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": `Telegram-Parser-Health-Check/${HEALTH_API_VERSION}`,
        },
        signal: controller.signal,
        cache: "no-store",
      })
      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        pythonApiStatus = data.status === "ok" ? "online" : "unhealthy"
        if (data.service) {
          pythonApiStatus += ` (${data.service})`
        }
        console.log(`✅ Python API responded: ${pythonApiStatus} (v${HEALTH_API_VERSION})`)
      } else {
        pythonApiStatus = "unhealthy"
        try {
          const errorData = await response.text()
          pythonApiError = `HTTP ${response.status}: ${response.statusText}. Response: ${errorData.substring(0, 200)}`
        } catch {
          pythonApiError = `HTTP ${response.status}: ${response.statusText}`
        }
        console.log(`❌ Python API unhealthy: ${pythonApiError} (v${HEALTH_API_VERSION})`)
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          pythonApiStatus = "timeout"
          pythonApiError = "Request timeout (5s)"
        } else if (error.message.includes("ECONNREFUSED")) {
          pythonApiStatus = "unavailable"
          pythonApiError = "Connection refused"
        } else if (
          error.message.toLowerCase().includes("fetch failed") ||
          error.message.toLowerCase().includes("networkerror") ||
          error.message.toLowerCase().includes("failed to fetch")
        ) {
          pythonApiStatus = "unavailable"
          pythonApiError = `Network error during fetch: ${error.message}`
        } else {
          pythonApiStatus = "error"
          pythonApiError = error.message
        }
      } else {
        pythonApiStatus = "error"
        try {
          pythonApiError = `Non-Error thrown (Python API check): ${JSON.stringify(error)}`
        } catch {
          pythonApiError = "Non-Error thrown (Python API check), not stringifiable."
        }
      }
      console.log(`⚠️ Python API error: ${pythonApiError} (v${HEALTH_API_VERSION})`)
    }

    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      platform: process.env.VERCEL_ENV || process.env.PLATFORM || "fly.io",
      region: process.env.VERCEL_REGION || process.env.FLY_REGION || "ams",
      version: HEALTH_API_VERSION,
      services: {
        nextjs: "online",
        pythonApi: pythonApiStatus,
      },
      pythonApiUrl: pythonApiUrl,
      pythonApiError: pythonApiError,
      openrouter_llm: "enabled",
      dependency_fixed: true,
      legacy_peer_deps: true,
      last_deployment_trigger: process.env.DEPLOYMENT_TRIGGER_INFO || "N/A",
    }

    console.log(`✅ Health check completed successfully (v${HEALTH_API_VERSION})`)
    return NextResponse.json(healthData)
  } catch (error) {
    console.error(`❌❌❌ Health check v${HEALTH_API_VERSION} CRITICAL ERROR (raw):`, error)
    if (error && typeof error === "object") {
      console.error(`Error object keys: ${Object.keys(error).join(", ")}`)
      console.error(`Error object prototype: ${Object.getPrototypeOf(error)}`)
    }

    let errorMessage = `An unexpected error occurred during health check (v${HEALTH_API_VERSION}).`
    const errorDetails: any = { type: typeof error, source: "main_catch_block_health_v" + HEALTH_API_VERSION }

    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails.name = error.name
      errorDetails.message = error.message
      if (process.env.NODE_ENV === "development" || process.env.DEBUG_MODE === "true") {
        errorDetails.stack = error.stack
      }
    } else if (typeof error === "string") {
      errorMessage = error
      errorDetails.value = error
    } else if (error && typeof error === "object") {
      if ((error as any).message && typeof (error as any).message === "string") {
        errorMessage = (error as any).message
      } else {
        errorMessage = `Error object received, but no standard 'message' property. Type: ${typeof error}.`
      }
      Object.keys(error).forEach((key) => {
        const value = (error as any)[key]
        if (typeof value !== "function" && typeof value !== "object") {
          errorDetails[key] = value
        } else if (typeof value === "object" && value !== null) {
          errorDetails[key] = `[Object type: ${value.constructor ? value.constructor.name : typeof value}]`
        }
      })
      if (Object.keys(errorDetails).length <= 2) {
        try {
          errorDetails.stringifiedFull = JSON.stringify(error)
        } catch {
          errorDetails.stringifiedFull = "Full error object is not stringifiable"
        }
      }
    } else {
      try {
        errorMessage = `Non-Error, non-object/string thrown: ${String(error)}`
        errorDetails.value = String(error)
      } catch (stringifyError) {
        errorMessage = "Could not stringify or convert the unknown error object."
        errorDetails.stringifyError =
          stringifyError instanceof Error ? stringifyError.message : "Unknown stringify/convert error"
      }
    }
    if (!errorMessage || errorMessage.trim() === "") {
      errorMessage = `Fallback: An unknown error of type '${typeof error}' occurred.`
    }

    // Return a plain text response if NextResponse.json itself might be failing
    // This is a last-ditch effort to get *any* error info out.
    const plainTextError = `
    Status: unhealthy
    Timestamp: ${new Date().toISOString()}
    Error: ${errorMessage}
    Error Type: ${typeof error}
    Error Details Source: ${errorDetails.source}
    Version: ${HEALTH_API_VERSION}
    --- Raw Error Details ---
    ${JSON.stringify(errorDetails, null, 2)}
    `
    console.error("Attempting to return plain text error response due to persistent JSON issues.")
    return new Response(plainTextError, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    })

    // Original JSON error response (commented out for plain text test)
    /*
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: errorMessage,
        errorDetails: errorDetails,
        environment: process.env.NODE_ENV || "development",
        platform: process.env.VERCEL_ENV || process.env.PLATFORM || "fly.io",
        region: process.env.VERCEL_REGION || process.env.FLY_REGION || "ams",
        version: HEALTH_API_VERSION,
      },
      { status: 500 },
    )
    */
  }
}
