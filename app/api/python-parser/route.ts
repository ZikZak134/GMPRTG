import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

const PYTHON_PARSER_API_VERSION = "1.2.3" // Incremented version

console.log(
  `🔵 PYTHON-PARSER API MODULE LOADED (v${PYTHON_PARSER_API_VERSION}) - Timestamp: ${new Date().toISOString()}`,
)

// Интерфейсы
interface ChannelData {
  url: string
  username: string
  title: string
  subscribers: number
  posts: number
  avgViews: number
  avgReactions: number
  er: number
  status: "success" | "error"
  error?: string
  ai_recommendations?: string
  search_results?: string
}

// Захардкоженный URL локального Python API
const LOCAL_API_URL = "http://localhost:5000"

/**
 * Handles GET requests to the python-parser API endpoint.
 * Provides information about how to use the API.
 */
export async function GET(req: NextRequest) {
  console.log(`ℹ️ GET request to python-parser API (v${PYTHON_PARSER_API_VERSION}) - ATTEMPTING BASIC RESPONSE`)
  try {
    // STEP 1: Try the most basic possible valid response.
    // If this works, the problem is in the subsequent logic (though GET is simple here).
    // If this itself fails with "Unknown error", the issue is very low-level.
    // return NextResponse.json({ message: "python-parser basic GET ok", version: PYTHON_PARSER_API_VERSION, timestamp: new Date().toISOString() });

    // STEP 2: If STEP 1 worked, uncomment the rest and comment out STEP 1.
    // This is the original intended GET logic.
    return NextResponse.json({
      message: "This is the python-parser API endpoint. Use POST to submit data.",
      available_actions: [
        "POST multipart/form-data with 'file' for Excel upload and analysis.",
        "POST application/json with 'type: single' for single channel analysis.",
        "POST application/json with 'type: search' for text search within a channel.",
        "POST application/json with 'type: export' to get Excel data.",
      ],
      version: PYTHON_PARSER_API_VERSION,
      status: "online",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    // Catch errors specifically within the GET handler
    console.error(`❌❌❌ python-parser GET API CRITICAL ERROR (v${PYTHON_PARSER_API_VERSION}) (raw):`, error)
    if (error && typeof error === "object") {
      console.error(`Error object keys (GET): ${Object.keys(error).join(", ")}`)
      console.error(`Error object prototype (GET): ${Object.getPrototypeOf(error)}`)
    }

    let errorMessage = `An unexpected error occurred in python-parser GET API (v${PYTHON_PARSER_API_VERSION}).`
    const errorDetails: any = {
      type: typeof error,
      source: "python_parser_get_handler_v" + PYTHON_PARSER_API_VERSION,
    }

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
        errorMessage = `Error object received in GET, but no standard 'message' property. Type: ${typeof error}.`
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
          errorDetails.stringifiedFull = "Full error object (GET) is not stringifiable"
        }
      }
    } else {
      try {
        errorMessage = `Non-Error, non-object/string thrown in GET: ${String(error)}`
        errorDetails.value = String(error)
      } catch (stringifyError) {
        errorMessage = "Could not stringify or convert the unknown error object in GET."
        errorDetails.stringifyError =
          stringifyError instanceof Error ? stringifyError.message : "Unknown stringify/convert error"
      }
    }
    if (!errorMessage || errorMessage.trim() === "") {
      errorMessage = `Fallback (GET): An unknown error of type '${typeof error}' occurred.`
    }

    // Return a plain text response if NextResponse.json itself might be failing
    const plainTextError = `
    Status: error_in_get_handler
    Timestamp: ${new Date().toISOString()}
    Error: ${errorMessage}
    Error Type: ${typeof error}
    Error Details Source: ${errorDetails.source}
    Version: ${PYTHON_PARSER_API_VERSION}
    --- Raw Error Details (from GET handler) ---
    ${JSON.stringify(errorDetails, null, 2)}
    `
    console.error(
      "Attempting to return plain text error response from python-parser GET due to persistent JSON issues.",
    )
    return new Response(plainTextError, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    })

    // Original JSON error response (commented out for plain text test)
    /*
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        errorDetails: errorDetails,
        version: PYTHON_PARSER_API_VERSION,
        status: "error_in_get_handler",
      },
      { status: 500 },
    )
    */
  }
}

export async function POST(req: NextRequest) {
  console.log(`🔄 Processing POST request to python-parser API (v${PYTHON_PARSER_API_VERSION})`)
  try {
    const contentType = req.headers.get("content-type")

    if (contentType?.includes("multipart/form-data")) {
      return await handleExcelUpload(req)
    } else if (contentType?.includes("application/json")) {
      const body = await req.json() // This can throw if body is not valid JSON
      const { type } = body

      if (type === "export") {
        return await handleExcelExport(body.data)
      } else if (type === "single") {
        return await handleSingleChannel(body)
      } else if (type === "search") {
        return await handleTextSearch(body)
      }
    }

    console.warn(`⚠️ Invalid POST request type or content-type: ${contentType} (v${PYTHON_PARSER_API_VERSION})`)
    return NextResponse.json(
      {
        success: false,
        error:
          "Invalid request type or content-type. Ensure 'Content-Type' is 'application/json' or 'multipart/form-data' and 'type' field is set for JSON.",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error(`❌ API POST error (v${PYTHON_PARSER_API_VERSION}):`, error)
    console.error(`❌ API POST error (raw) (v${PYTHON_PARSER_API_VERSION}):`, error)
    if (error && typeof error === "object") {
      console.error(`Error object keys (POST): ${Object.keys(error).join(", ")}`)
      console.error(`Error object prototype (POST): ${Object.getPrototypeOf(error)}`)
    }

    let errorMessage = `An unexpected error occurred in python-parser POST API (v${PYTHON_PARSER_API_VERSION}).`
    const errorDetails: any = {
      type: typeof error,
      source: "python_parser_post_handler_v" + PYTHON_PARSER_API_VERSION,
    }

    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      errorMessage = "Invalid JSON in request body."
      errorDetails.name = error.name
      errorDetails.message = error.message
    } else if (error instanceof Error) {
      errorMessage = error.message
      errorDetails.name = error.name
      errorDetails.message = error.message
      if (process.env.NODE_ENV === "development" || process.env.DEBUG_MODE === "true") {
        errorDetails.stack = error.stack
      }
    } else if (typeof error === "string") {
      errorMessage = error
      errorDetails.value = error
    } else if (error && typeof error === "object" && (error as any).message) {
      errorMessage = (error as any).message
      Object.keys(error).forEach((key) => {
        const value = (error as any)[key]
        if (typeof value !== "function" && typeof value !== "object") {
          errorDetails[key] = value
        } else if (typeof value === "object" && value !== null) {
          errorDetails[key] = `[Object type: ${value.constructor ? value.constructor.name : typeof value}]`
        }
      })
    } else {
      try {
        errorMessage = `Non-Error object thrown in POST: ${String(error)}`
        errorDetails.value = String(error)
      } catch (stringifyError) {
        errorMessage = "Could not stringify or convert the non-Error error object in POST."
        errorDetails.stringifyError = (stringifyError as Error).message
      }
    }
    if (!errorMessage || errorMessage.trim() === "") {
      errorMessage = `Fallback (POST): An unknown error of type '${typeof error}' occurred.`
    }

    // For POST, we'll stick to JSON error response for now, assuming GET is the primary preview issue.
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        errorDetails: errorDetails,
        details: `Check server logs for more information. API Version: ${PYTHON_PARSER_API_VERSION}`,
      },
      { status: 500 },
    )
  }
}

async function handleTextSearch(body: any) {
  const { channelUrl, searchQuery, periodDays = 7, postLimit = 50 } = body

  if (!channelUrl || !searchQuery) {
    return NextResponse.json({ success: false, error: "Channel URL and search query are required" }, { status: 400 })
  }

  try {
    console.log(`🔍 Searching text in channel: ${channelUrl}, query: ${searchQuery} (v${PYTHON_PARSER_API_VERSION})`)

    const response = await fetch(`${LOCAL_API_URL}/api/analyze-channel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": `Python-Parser-Service/${PYTHON_PARSER_API_VERSION}`,
      },
      body: JSON.stringify({
        channelUrl,
        periodDays,
        postLimit,
        searchQuery,
      }),
      signal: AbortSignal.timeout(120000), // 120 seconds timeout
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Python API error: ${response.status} ${response.statusText} - ${errorText.substring(0, 500)}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || "Python API returned error")
    }

    console.log(`✅ Successfully searched text in channel: ${channelUrl} (v${PYTHON_PARSER_API_VERSION})`)
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error(`❌ Text search error (v${PYTHON_PARSER_API_VERSION}):`, error)

    if (
      error instanceof Error &&
      (error.message.includes("ECONNREFUSED") || error.message.toLowerCase().includes("fetch failed"))
    ) {
      console.log(`⚠️ Local Python API unavailable, using simulation (v${PYTHON_PARSER_API_VERSION})`)
      return NextResponse.json({
        success: true,
        data: await simulateTextSearch(channelUrl, searchQuery, periodDays, postLimit),
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to search text",
      },
      { status: 500 },
    )
  }
}

async function handleExcelUpload(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    console.log(`📁 Processing Excel file: ${file.name}, Size: ${file.size} (v${PYTHON_PARSER_API_VERSION})`)

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]

    const channels: { url: string; days: number; limit: number }[] = []

    data.forEach((row, index) => {
      if (index === 0) return // Skip header row

      const cell = row[0] // URL cell
      if (typeof cell === "string") {
        let channelUrl = ""

        if (cell.includes("t.me/")) {
          const match = cell.match(/https?:\/\/t\.me\/[a-zA-Z0-9_]+/g)
          if (match) {
            channelUrl = match[0]
          } else {
            const cleanUrl = cell.replace(/.*?(t\.me\/[a-zA-Z0-9_]+).*/, "https://$1")
            if (cleanUrl.startsWith("https://t.me/")) {
              channelUrl = cleanUrl
            }
          }
        } else if (cell.startsWith("@")) {
          channelUrl = `https://t.me/${cell.substring(1)}`
        }

        if (channelUrl) {
          const days = typeof row[1] === "number" && row[1] > 0 ? row[1] : 7
          const limit = typeof row[2] === "number" && row[2] > 0 ? row[2] : 50
          channels.push({ url: channelUrl, days, limit })
        }
      }
    })

    if (channels.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid Telegram channels found in Excel file. Ensure URLs are in the first column.",
        },
        { status: 400 },
      )
    }

    console.log(`📊 Found ${channels.length} channels to analyze with OpenRouter AI (v${PYTHON_PARSER_API_VERSION})`)
    const results = await analyzeChannelsWithLocalAPI(channels)
    return NextResponse.json({ success: true, data: results })
  } catch (error) {
    console.error(`❌ Excel upload error (v${PYTHON_PARSER_API_VERSION}):`, error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process Excel file",
      },
      { status: 500 },
    )
  }
}

async function handleSingleChannel(body: any) {
  const { channelUrl, periodDays = 7, postLimit = 50 } = body

  if (!channelUrl) {
    return NextResponse.json({ success: false, error: "Channel URL is required" }, { status: 400 })
  }

  try {
    console.log(`🔍 Analyzing single channel with OpenRouter AI: ${channelUrl} (v${PYTHON_PARSER_API_VERSION})`)
    const result = await analyzeSingleChannelWithLocalAPI(channelUrl, periodDays, postLimit)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error(`❌ Single channel analysis error (v${PYTHON_PARSER_API_VERSION}):`, error)

    if (error instanceof Error && error.message.includes("FloodWait")) {
      const waitMatch = error.message.match(/(\d+)/)
      const waitTime = waitMatch ? Number.parseInt(waitMatch[1]) : 300
      return NextResponse.json(
        { success: false, error: `FloodWait: необходимо подождать ${waitTime} секунд`, floodWait: waitTime },
        { status: 429 },
      )
    }
    return NextResponse.json({ success: false, error: handleTelegramError(error) }, { status: 500 })
  }
}

async function handleExcelExport(data: any[]) {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ success: false, error: "No data provided for export" }, { status: 400 })
    }
    console.log(`📊 Exporting ${data.length} channels to Excel (v${PYTHON_PARSER_API_VERSION})`)

    const excelData = data.map(
      (channel: Partial<ChannelData & { ai_recommendations?: string; search_results?: string }>) => ({
        Канал: channel.title || "N/A",
        Username: channel.username || "N/A",
        URL: channel.url || "N/A",
        Подписчики: channel.subscribers || 0,
        "Постов за период": channel.posts || 0,
        "Среднее просмотров": channel.avgViews || 0,
        "Среднее реакций": channel.avgReactions || 0,
        "Коэффициент вовлеченности (ER)": `${channel.er || 0}%`,
        "Охват аудитории": `${(((channel.avgViews || 0) / Math.max(channel.subscribers || 1, 1)) * 100).toFixed(1)}%`,
        Статус: channel.status === "success" ? "Успешно" : "Ошибка",
        "AI Рекомендации (OpenRouter)": channel.ai_recommendations || "",
        "Результаты поиска": channel.search_results || "",
        Ошибка: channel.error || "",
        "Дата анализа": new Date().toLocaleDateString("ru-RU"),
        Платформа: "Fly.io Production + OpenRouter LLM",
        Регион: process.env.FLY_REGION || "ams",
      }),
    )

    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Анализ каналов с OpenRouter AI")

    const colWidths = [
      { wch: 25 },
      { wch: 20 },
      { wch: 35 },
      { wch: 15 },
      { wch: 18 },
      { wch: 20 },
      { wch: 18 },
      { wch: 25 },
      { wch: 18 },
      { wch: 12 },
      { wch: 60 },
      { wch: 40 },
      { wch: 30 },
      { wch: 15 },
      { wch: 35 },
      { wch: 15 },
    ]
    worksheet["!cols"] = colWidths

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
    const base64 = buffer.toString("base64")

    console.log(`✅ Excel file created successfully (v${PYTHON_PARSER_API_VERSION})`)
    return NextResponse.json({
      success: true,
      downloadUrl: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`,
    })
  } catch (error) {
    console.error(`❌ Excel export error (v${PYTHON_PARSER_API_VERSION}):`, error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to export Excel" },
      { status: 500 },
    )
  }
}

async function analyzeSingleChannelWithLocalAPI(channelUrl: string, periodDays: number, postLimit: number) {
  try {
    console.log(`🔗 Calling local Python API: ${LOCAL_API_URL}/api/analyze-channel (v${PYTHON_PARSER_API_VERSION})`)
    const response = await fetch(`${LOCAL_API_URL}/api/analyze-channel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": `Python-Parser-Service/${PYTHON_PARSER_API_VERSION}`,
      },
      body: JSON.stringify({ channelUrl, periodDays, postLimit }),
      signal: AbortSignal.timeout(120000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Local Python API error: ${response.status} ${response.statusText} - ${errorText.substring(0, 500)}`,
      )
    }
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || "Local Python API returned error")
    }
    console.log(`✅ Successfully analyzed channel with OpenRouter AI: ${channelUrl} (v${PYTHON_PARSER_API_VERSION})`)
    return result.data
  } catch (error) {
    console.error(`❌ Local Python API error (v${PYTHON_PARSER_API_VERSION}):`, error)
    if (
      error instanceof Error &&
      (error.message.includes("ECONNREFUSED") || error.message.toLowerCase().includes("fetch failed"))
    ) {
      console.log(`⚠️ Local Python API unavailable, using simulation with AI (v${PYTHON_PARSER_API_VERSION})`)
      return await simulateSingleChannelAnalysis(channelUrl, periodDays, postLimit)
    }
    throw error
  }
}

async function analyzeChannelsWithLocalAPI(channels: { url: string; days: number; limit: number }[]) {
  const results: ChannelData[] = []
  for (const channel of channels) {
    try {
      console.log(`🔍 Analyzing channel ${channel.url} with OpenRouter AI... (v${PYTHON_PARSER_API_VERSION})`)
      const result = await analyzeSingleChannelWithLocalAPI(channel.url, channel.days, channel.limit)
      results.push(result)
      await new Promise((resolve) => setTimeout(resolve, 3000))
    } catch (error) {
      console.error(`❌ Error analyzing channel ${channel.url} (v${PYTHON_PARSER_API_VERSION}):`, error)
      results.push({
        url: channel.url,
        username: extractUsername(channel.url),
        title: "Unknown",
        subscribers: 0,
        posts: 0,
        avgViews: 0,
        avgReactions: 0,
        er: 0,
        status: "error" as const,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }
  return results
}

async function simulateSingleChannelAnalysis(
  channelUrl: string,
  periodDays: number,
  postLimit: number,
): Promise<ChannelData> {
  console.log(`🎭 Simulating analysis with OpenRouter AI for: ${channelUrl} (v${PYTHON_PARSER_API_VERSION})`)
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000))

  const username = extractUsername(channelUrl)
  const isSuccess =
    !channelUrl.includes("private") && !channelUrl.includes("nonexistent") && !channelUrl.includes("fail")

  if (isSuccess) {
    let subscribers, avgViews, avgReactions, title
    if (username.includes("durov")) {
      title = "Pavel Durov"
      subscribers = 1200000 + Math.floor(Math.random() * 100000)
      avgViews = Math.floor(subscribers * (0.3 + Math.random() * 0.2))
      avgReactions = Math.floor(avgViews * (0.01 + Math.random() * 0.02))
    } else if (username.includes("telegram")) {
      title = "Telegram News"
      subscribers = 8000000 + Math.floor(Math.random() * 500000)
      avgViews = Math.floor(subscribers * (0.25 + Math.random() * 0.15))
      avgReactions = Math.floor(avgViews * (0.008 + Math.random() * 0.015))
    } else {
      title = `Simulated: ${username.replace("@", "")}`
      subscribers = Math.floor(Math.random() * 500000) + 10000
      avgViews = Math.floor(subscribers * (0.05 + Math.random() * 0.4))
      avgReactions = Math.floor(avgViews * (0.005 + Math.random() * 0.03))
    }
    const posts = Math.floor(Math.random() * Math.min(periodDays * 2, postLimit)) + 1
    const er = subscribers > 0 ? Number(((avgReactions / subscribers) * 100).toFixed(2)) : 0

    return {
      url: channelUrl,
      username,
      title,
      subscribers,
      posts,
      avgViews,
      avgReactions,
      er,
      status: "success" as const,
      ai_recommendations: `• Simulated AI: Optimize posting times for ${username}.\n• Simulated AI: Increase interactive content like polls.\n• Simulated AI: Use more visuals.`,
    }
  } else {
    return {
      url: channelUrl,
      username,
      title: "Unknown (Simulated Error)",
      subscribers: 0,
      posts: 0,
      avgViews: 0,
      avgReactions: 0,
      er: 0,
      status: "error" as const,
      error: "Simulated: Channel not accessible or private.",
    }
  }
}

async function simulateTextSearch(
  channelUrl: string,
  searchQuery: string,
  periodDays: number,
  postLimit: number,
): Promise<Partial<ChannelData>> {
  console.log(`🎭 Simulating text search for: ${channelUrl}, query: ${searchQuery} (v${PYTHON_PARSER_API_VERSION})`)
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000))
  const username = extractUsername(channelUrl)
  return {
    url: channelUrl,
    username,
    title: `Simulated Search: ${username.replace("@", "")}`,
    subscribers: Math.floor(Math.random() * 100000) + 1000,
    status: "success" as const,
    search_results: `Simulated: Found 3 posts matching "${searchQuery}" in ${username}.\nKey topics: simulated trend A, simulated market B.\nSummary: Channel ${username} frequently discusses "${searchQuery}".`,
  }
}

function extractUsername(url: string): string {
  const match = url.match(/t\.me\/([a-zA-Z0-9_]+)/)
  return match ? `@${match[1]}` : "Unknown"
}

function handleTelegramError(error: any): string {
  const errorStr = error?.message || error?.toString() || ""
  if (errorStr.includes("FloodWait")) {
    const waitMatch = errorStr.match(/(\d+)/)
    return `Превышен лимит запросов. Попробуйте через ${waitMatch ? waitMatch[1] : "неизвестно"} секунд.`
  }
  if (errorStr.includes("ChannelPrivate") || errorStr.includes("ChatAdminRequired"))
    return "Канал не найден, является приватным или требует прав администратора."
  if (errorStr.includes("UsernameNotOccupied")) return "Канал с таким именем не существует."
  if (errorStr.includes("ECONNREFUSED") || errorStr.toLowerCase().includes("fetch failed"))
    return "Локальный Python API недоступен. Используется симуляция данных."
  if (errorStr.includes("timeout")) return "Таймаут при обращении к API Telethon."

  console.warn(`Unhandled Telegram Error: ${errorStr} (v${PYTHON_PARSER_API_VERSION})`)
  return "Ошибка при анализе канала. Проверьте правильность ссылки или попробуйте позже."
}
