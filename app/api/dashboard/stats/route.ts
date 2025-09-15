import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get user's reading statistics
    const [
      totalBooksStarted,
      totalBooksCompleted,
      totalBooksReading,
      totalBooksPaused,
      currentUser,
      recentProgress,
      monthlyStats
    ] = await Promise.all([
      // Total books started
      prisma.readingProgress.count({
        where: {
          userId,
          status: { not: "NOT_STARTED" }
        }
      }),

      // Total books completed
      prisma.readingProgress.count({
        where: {
          userId,
          status: "COMPLETED"
        }
      }),

      // Currently reading
      prisma.readingProgress.count({
        where: {
          userId,
          status: "READING"
        }
      }),

      // Paused books
      prisma.readingProgress.count({
        where: {
          userId,
          status: "PAUSED"
        }
      }),

      // User details with points and level
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          points: true,
          level: true,
          name: true,
          role: true,
        }
      }),

      // Recent reading progress
      prisma.readingProgress.findMany({
        where: { userId },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              coverImage: true,
              category: true,
              pages: true,
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 5
      }),

      // Monthly reading statistics (last 6 months)
      prisma.readingProgress.findMany({
        where: {
          userId,
          updatedAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
          }
        },
        select: {
          updatedAt: true,
          status: true,
        }
      })
    ])

    // Calculate reading streak (consecutive days with reading activity)
    const readingStreak = await calculateReadingStreak(userId)

    // Process monthly stats
    const monthlyData = processMonthlyStats(monthlyStats)

    // Calculate completion rate
    const completionRate = totalBooksStarted > 0 
      ? Math.round((totalBooksCompleted / totalBooksStarted) * 100)
      : 0

    // Calculate average progress for currently reading books
    const currentlyReadingBooks = await prisma.readingProgress.findMany({
      where: {
        userId,
        status: "READING"
      },
      select: {
        progressPercentage: true,
      }
    })

    const averageProgress = currentlyReadingBooks.length > 0
      ? Math.round(
          currentlyReadingBooks.reduce((sum, book) => sum + book.progressPercentage, 0) / 
          currentlyReadingBooks.length
        )
      : 0

    // Get reading categories breakdown
    const categoryStats = await prisma.readingProgress.groupBy({
      by: ['bookId'],
      where: {
        userId,
        status: { not: "NOT_STARTED" }
      },
      _count: true
    })

    const categoryBreakdown = await prisma.book.findMany({
      where: {
        id: {
          in: categoryStats.map(stat => stat.bookId)
        }
      },
      select: {
        category: true,
      }
    })

    const categoryCounts = categoryBreakdown.reduce((acc: Record<string, number>, book) => {
      acc[book.category] = (acc[book.category] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalBooksStarted,
          totalBooksCompleted,
          totalBooksReading,
          totalBooksPaused,
          completionRate,
          averageProgress,
          readingStreak,
        },
        user: {
          points: currentUser?.points || 0,
          level: currentUser?.level || 1,
          name: currentUser?.name,
          role: currentUser?.role,
        },
        recentProgress,
        monthlyStats: monthlyData,
        categoryBreakdown: categoryCounts,
      }
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    )
  }
}

async function calculateReadingStreak(userId: string): Promise<number> {
  try {
    const activities = await prisma.readingProgress.findMany({
      where: { userId },
      select: {
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    if (activities.length === 0) return 0

    let streak = 0
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    const activityDates = activities.map(activity => {
      const date = new Date(activity.updatedAt)
      date.setHours(0, 0, 0, 0)
      return date.getTime()
    })

    const uniqueDates = [...new Set(activityDates)].sort((a, b) => b - a)

    for (const dateTime of uniqueDates) {
      if (dateTime === currentDate.getTime()) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else if (dateTime === currentDate.getTime()) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  } catch (error) {
    console.error("Error calculating reading streak:", error)
    return 0
  }
}

function processMonthlyStats(stats: Array<{ updatedAt: Date; status: string }>) {
  const monthlyData = []
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = date.toLocaleString('default', { month: 'short' })
    
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    const monthStats = stats.filter(stat => {
      const statDate = new Date(stat.updatedAt)
      return statDate >= monthStart && statDate <= monthEnd
    })

    const completed = monthStats.filter(stat => stat.status === 'COMPLETED').length
    const started = monthStats.filter(stat => stat.status === 'READING').length

    monthlyData.push({
      month: monthName,
      completed,
      started,
      total: completed + started
    })
  }

  return monthlyData
}