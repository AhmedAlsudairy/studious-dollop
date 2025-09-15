import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "students" // students, teachers, all
    const period = searchParams.get("period") || "all" // week, month, all
    const limit = parseInt(searchParams.get("limit") || "10")

    // Calculate date ranges
    const now = new Date()
    let dateFilter: { gte?: Date } = {}
    
    if (period === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      dateFilter = { gte: weekAgo }
    } else if (period === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      dateFilter = { gte: monthAgo }
    }

    // Build user filter based on type
    let userRoleFilter: Prisma.UserWhereInput = {}
    if (type === "students") {
      userRoleFilter = { role: "STUDENT" }
    } else if (type === "teachers") {
      userRoleFilter = { role: { in: ["TEACHER", "ADMIN"] } }
    }

    // Get users with their reading statistics
    const users = await prisma.user.findMany({
      where: userRoleFilter,
      include: {
        readingProgress: {
          where: {
            ...(Object.keys(dateFilter).length > 0 && {
              updatedAt: dateFilter
            })
          },
          include: {
            book: {
              select: {
                title: true,
                pages: true,
              }
            }
          }
        },
        summaries: {
          where: {
            ...(Object.keys(dateFilter).length > 0 && {
              createdAt: dateFilter
            })
          },
          select: {
            id: true,
            rating: true,
          }
        },
        _count: {
          select: {
            readingProgress: true,
            summaries: true,
          }
        }
      },
      orderBy: {
        points: 'desc'
      },
      take: limit
    })

    // Calculate additional statistics for each user
    const leaderboard = users.map((user, index) => {
      const completedBooks = user.readingProgress.filter(
        progress => progress.status === "COMPLETED"
      ).length

      const readingBooks = user.readingProgress.filter(
        progress => progress.status === "READING"
      ).length

      const totalPagesRead = user.readingProgress
        .filter(progress => progress.status === "COMPLETED")
        .reduce((total, progress) => total + (progress.book.pages || 0), 0)

      const averageSummaryRating = user.summaries.length > 0
        ? user.summaries.reduce((sum, summary) => sum + summary.rating, 0) / user.summaries.length
        : 0

      // Calculate reading streak (simplified - consecutive days with activity)
      const sortedProgress = user.readingProgress
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

      let readingStreak = 0
      if (sortedProgress.length > 0) {
        const lastActivity = new Date(sortedProgress[0].updatedAt)
        const today = new Date()
        const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff <= 1) { // Active today or yesterday
          readingStreak = Math.min(sortedProgress.length, 30) // Cap at 30 days for display
        }
      }

      return {
        rank: index + 1,
        user: {
          id: user.id,
          name: user.name || "Unknown User",
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          level: user.level,
        },
        stats: {
          points: user.points,
          booksCompleted: completedBooks,
          booksReading: readingBooks,
          totalBooksStarted: user.readingProgress.length,
          totalPagesRead,
          summariesWritten: user.summaries.length,
          averageSummaryRating: Math.round(averageSummaryRating * 10) / 10,
          readingStreak,
          completionRate: user.readingProgress.length > 0 
            ? Math.round((completedBooks / user.readingProgress.length) * 100)
            : 0
        }
      }
    })

    // Get overall statistics
    const totalUsers = await prisma.user.count({ where: userRoleFilter })
    const totalBooksInLibrary = await prisma.book.count()
    const totalReadingProgress = await prisma.readingProgress.count({
      where: {
        user: userRoleFilter,
        ...(Object.keys(dateFilter).length > 0 && {
          updatedAt: dateFilter
        })
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        leaderboard,
        metadata: {
          type,
          period,
          totalUsers,
          totalBooksInLibrary,
          totalReadingProgress,
          lastUpdated: new Date().toISOString(),
        }
      }
    })
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    )
  }
}