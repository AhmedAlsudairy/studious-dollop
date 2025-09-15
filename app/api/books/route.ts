import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

// Get books with filtering, search, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const difficulty = searchParams.get("difficulty")
    const author = searchParams.get("author")

    const skip = (page - 1) * limit

    // Build where clause for filtering
    const where: {
      category?: string;
      difficulty?: string;
      author?: { contains: string; mode: 'insensitive' };
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' };
        author?: { contains: string; mode: 'insensitive' };
        description?: { contains: string; mode: 'insensitive' };
      }>;
    } = {}

    if (category) {
      where.category = category
    }

    if (difficulty) {
      where.difficulty = difficulty
    }

    if (author) {
      where.author = {
        contains: author,
        mode: 'insensitive'
      }
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          author: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Get books with pagination
    const [books, totalCount] = await Promise.all([
      prisma.book.findMany({
        where,
        include: {
          readingProgress: {
            select: {
              id: true,
              status: true,
              progressPercentage: true,
              userId: true,
            }
          },
          _count: {
            select: {
              readingProgress: true,
              summaries: true,
              comments: true,
              likes: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.book.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: {
        books,
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
    console.error("Error fetching books:", error)
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    )
  }
}

// Create a new book
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Only teachers and admins can create books
    if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const {
      title,
      author,
      description,
      coverImage,
      isbn,
      category,
      pages,
      language = "en",
      publishedAt,
      difficulty
    } = await request.json()

    // Validate required fields
    if (!title || !author || !category) {
      return NextResponse.json(
        { error: "Title, author, and category are required" },
        { status: 400 }
      )
    }

    // Check if ISBN already exists (if provided)
    if (isbn) {
      const existingBook = await prisma.book.findUnique({
        where: { isbn }
      })

      if (existingBook) {
        return NextResponse.json(
          { error: "A book with this ISBN already exists" },
          { status: 409 }
        )
      }
    }

    const book = await prisma.book.create({
      data: {
        title,
        author,
        description,
        coverImage,
        isbn,
        category,
        pages: pages ? parseInt(pages) : null,
        language,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        difficulty,
      },
      include: {
        _count: {
          select: {
            readingProgress: true,
            summaries: true,
            comments: true,
            likes: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: book,
      message: "Book created successfully"
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating book:", error)
    return NextResponse.json(
      { error: "Failed to create book" },
      { status: 500 }
    )
  }
}