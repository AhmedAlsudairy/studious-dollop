import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

// Get a single book by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        readingProgress: {
          select: {
            id: true,
            status: true,
            progressPercentage: true,
            currentPage: true,
            startedAt: true,
            completedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        summaries: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              }
            },
            _count: {
              select: {
                likes: true,
                comments: true,
              }
            }
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
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
      }
    })

    if (!book) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: book
    })
  } catch (error) {
    console.error("Error fetching book:", error)
    return NextResponse.json(
      { error: "Failed to fetch book" },
      { status: 500 }
    )
  }
}

// Update a book by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Only teachers and admins can update books
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
      language,
      publishedAt,
      difficulty
    } = await request.json()

    // Check if book exists
    const existingBook = await prisma.book.findUnique({
      where: { id }
    })

    if (!existingBook) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      )
    }

    // Check if ISBN is being changed and if it conflicts with another book
    if (isbn && isbn !== existingBook.isbn) {
      const bookWithSameISBN = await prisma.book.findUnique({
        where: { isbn }
      })

      if (bookWithSameISBN) {
        return NextResponse.json(
          { error: "A book with this ISBN already exists" },
          { status: 409 }
        )
      }
    }

    const updatedBook = await prisma.book.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(author && { author }),
        ...(description !== undefined && { description }),
        ...(coverImage !== undefined && { coverImage }),
        ...(isbn !== undefined && { isbn }),
        ...(category && { category }),
        ...(pages !== undefined && { pages: pages ? parseInt(pages) : null }),
        ...(language && { language }),
        ...(publishedAt !== undefined && { 
          publishedAt: publishedAt ? new Date(publishedAt) : null 
        }),
        ...(difficulty !== undefined && { difficulty }),
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
      data: updatedBook,
      message: "Book updated successfully"
    })
  } catch (error) {
    console.error("Error updating book:", error)
    return NextResponse.json(
      { error: "Failed to update book" },
      { status: 500 }
    )
  }
}

// Delete a book by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Only admins can delete books
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    // Check if book exists
    const existingBook = await prisma.book.findUnique({
      where: { id }
    })

    if (!existingBook) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      )
    }

    // Delete the book (this will cascade delete related records)
    await prisma.book.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: "Book deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting book:", error)
    return NextResponse.json(
      { error: "Failed to delete book" },
      { status: 500 }
    )
  }
}