import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

// Get summaries with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get("bookId")
    const userId = searchParams.get("userId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const isPublic = searchParams.get("isPublic")

    const skip = (page - 1) * limit

    // Build where clause
    const where: {
      bookId?: string;
      authorId?: string;
      isPublic?: boolean;
    } = {}

    if (bookId) {
      where.bookId = bookId
    }

    if (userId) {
      where.authorId = userId
    }

    if (isPublic !== null) {
      where.isPublic = isPublic === "true"
    }

    // Get summaries with pagination
    const [summaries, totalCount] = await Promise.all([
      prisma.summary.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatar: true,
            }
          },
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              coverImage: true,
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.summary.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: {
        summaries,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }
      }
    })
  } catch (error) {
    console.error("Error fetching summaries:", error)
    return NextResponse.json(
      { error: "Failed to fetch summaries" },
      { status: 500 }
    )
  }
}

// Create a new summary
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const {
      title,
      content,
      bookId,
      isPublic = true
    } = await request.json()

    // Validate required fields
    if (!content || !bookId) {
      return NextResponse.json(
        { error: "Content and book ID are required" },
        { status: 400 }
      )
    }

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId }
    })

    if (!book) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      )
    }

    // Auto-generate title if not provided
    const summaryTitle = title || `Summary of "${book.title}" by ${session.user.name}`

    // Check if user has already submitted a summary for this book
    const existingSummary = await prisma.summary.findFirst({
      where: {
        authorId: session.user.id,
        bookId: bookId
      }
    })

    if (existingSummary) {
      return NextResponse.json(
        { error: "You have already submitted a summary for this book" },
        { status: 409 }
      )
    }

    const summary = await prisma.summary.create({
      data: {
        title: summaryTitle,
        content,
        authorId: session.user.id,
        bookId,
        isPublic,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          }
        },
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            coverImage: true,
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          }
        }
      }
    })

    // Award points for creating a summary
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        points: {
          increment: 50 // Award 50 points for creating a summary
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: summary,
      message: "Summary created successfully"
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating summary:", error)
    return NextResponse.json(
      { error: "Failed to create summary" },
      { status: 500 }
    )
  }
}