import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

// Get a specific summary
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const summary = await prisma.summary.findUnique({
      where: { id },
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
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
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

    if (!summary) {
      return NextResponse.json(
        { error: "Summary not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: summary
    })
  } catch (error) {
    console.error("Error fetching summary:", error)
    return NextResponse.json(
      { error: "Failed to fetch summary" },
      { status: 500 }
    )
  }
}

// Update summary rating (teachers only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Only teachers and admins can rate summaries
    if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const { id } = await params
    const { rating, feedback } = await request.json()

    // Validate rating
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be a number between 1 and 5" },
        { status: 400 }
      )
    }

    // Check if summary exists
    const existingSummary = await prisma.summary.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true }
        }
      }
    })

    if (!existingSummary) {
      return NextResponse.json(
        { error: "Summary not found" },
        { status: 404 }
      )
    }

    // Update the summary with rating
    const updatedSummary = await prisma.summary.update({
      where: { id },
      data: {
        rating,
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

    // If feedback is provided, add it as a comment
    if (feedback && feedback.trim()) {
      await prisma.comment.create({
        data: {
          content: `Teacher Feedback: ${feedback}`,
          authorId: session.user.id,
          summaryId: id,
        }
      })
    }

    // Award additional points to the student based on rating
    const bonusPoints = Math.round(rating * 10) // 1 star = 10 points, 5 stars = 50 points
    await prisma.user.update({
      where: { id: existingSummary.author.id },
      data: {
        points: {
          increment: bonusPoints
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedSummary,
      message: `Summary rated successfully. Student awarded ${bonusPoints} bonus points!`
    })
  } catch (error) {
    console.error("Error rating summary:", error)
    return NextResponse.json(
      { error: "Failed to rate summary" },
      { status: 500 }
    )
  }
}

// Delete summary (author or admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { id } = await params

    // Check if summary exists
    const existingSummary = await prisma.summary.findUnique({
      where: { id },
      select: { authorId: true }
    })

    if (!existingSummary) {
      return NextResponse.json(
        { error: "Summary not found" },
        { status: 404 }
      )
    }

    // Check permissions (author or admin)
    if (existingSummary.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    // Delete the summary
    await prisma.summary.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: "Summary deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting summary:", error)
    return NextResponse.json(
      { error: "Failed to delete summary" },
      { status: 500 }
    )
  }
}