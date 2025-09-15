import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { ReadingStatus } from '@prisma/client'

// Get user's reading progress for all books or a specific book
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get("bookId")
    const status = searchParams.get("status")

    const where: {
      userId: string;
      bookId?: string;
      status?: ReadingStatus;
    } = {
      userId: session.user.id
    }

    if (bookId) {
      where.bookId = bookId
    }

    if (status) {
      where.status = status as ReadingStatus
    }

    const readingProgress = await prisma.readingProgress.findMany({
      where,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            coverImage: true,
            pages: true,
            category: true,
            difficulty: true,
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: readingProgress
    })
  } catch (error) {
    console.error("Error fetching reading progress:", error)
    return NextResponse.json(
      { error: "Failed to fetch reading progress" },
      { status: 500 }
    )
  }
}

// Create or update reading progress
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
      bookId,
      status,
      currentPage,
      totalPages
    } = await request.json()

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required" },
        { status: 400 }
      )
    }

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true, pages: true }
    })

    if (!book) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      )
    }

    // Calculate progress percentage
    const pages = totalPages || book.pages || 0
    const progressPercentage = pages > 0 ? Math.min((currentPage || 0) / pages * 100, 100) : 0

    // Determine timestamps based on status
    const now = new Date()
    let startedAt: Date | undefined
    let completedAt: Date | undefined

    if (status === 'READING' || status === 'PAUSED') {
      startedAt = now
    } else if (status === 'COMPLETED') {
      startedAt = now
      completedAt = now
    }

    // Upsert reading progress
    const readingProgress = await prisma.readingProgress.upsert({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId
        }
      },
      update: {
        status,
        currentPage: currentPage || 0,
        totalPages: pages,
        progressPercentage,
        ...(startedAt && { startedAt }),
        ...(completedAt && { completedAt }),
      },
      create: {
        userId: session.user.id,
        bookId,
        status: status || 'NOT_STARTED',
        currentPage: currentPage || 0,
        totalPages: pages,
        progressPercentage,
        ...(startedAt && { startedAt }),
        ...(completedAt && { completedAt }),
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            coverImage: true,
            pages: true,
            category: true,
            difficulty: true,
          }
        }
      }
    })

    // Award points for reading milestones
    if (status === 'COMPLETED') {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          points: {
            increment: 100 // Award 100 points for completing a book
          }
        }
      })
    } else if (status === 'READING' && progressPercentage >= 50) {
      // Award points for reaching 50% progress
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          points: {
            increment: 25
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: readingProgress,
      message: "Reading progress updated successfully"
    })
  } catch (error) {
    console.error("Error updating reading progress:", error)
    return NextResponse.json(
      { error: "Failed to update reading progress" },
      { status: 500 }
    )
  }
}