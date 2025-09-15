"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen,
  Clock,
  Star,
  Target,
  Award,
  BarChart3,
  Trophy,
  Activity,
  PieChart
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface DashboardStats {
  overview: {
    totalBooksStarted: number
    totalBooksCompleted: number
    totalBooksReading: number
    totalBooksPaused: number
    completionRate: number
    averageProgress: number
    readingStreak: number
  }
  user: {
    points: number
    level: number
    name: string
    role: string
  }
  recentProgress: Array<{
    id: string
    status: string
    progressPercentage: number
    currentPage: number
    updatedAt: string
    book: {
      id: string
      title: string
      author: string
      coverImage?: string
      category: string
      pages?: number
    }
  }>
  monthlyStats: Array<{
    month: string
    completed: number
    started: number
    total: number
  }>
  categoryBreakdown: Record<string, number>
}

export default function DashboardPage() {
  const { status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      fetchDashboardStats()
    }
  }, [status, router])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/dashboard/stats")
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      } else {
        setError("Failed to fetch dashboard statistics")
      }
    } catch (err) {
      setError("An error occurred while fetching dashboard data")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-500">
          <p>{error || "Failed to load dashboard"}</p>
          <Button onClick={fetchDashboardStats} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-500"
      case "READING": return "bg-blue-500"
      case "PAUSED": return "bg-yellow-500"
      default: return "bg-gray-500"
    }
  }

  const getNextLevelPoints = (currentLevel: number) => {
    return currentLevel * 1000 // Each level requires 1000 more points
  }

  const getCurrentLevelPoints = (currentLevel: number) => {
    return (currentLevel - 1) * 1000
  }

  const levelProgress = () => {
    const currentLevelPoints = getCurrentLevelPoints(stats.user.level)
    const nextLevelPoints = getNextLevelPoints(stats.user.level)
    const progressPoints = stats.user.points - currentLevelPoints
    const totalPointsNeeded = nextLevelPoints - currentLevelPoints
    return Math.min((progressPoints / totalPointsNeeded) * 100, 100)
  }

  const categoryData = Object.entries(stats.categoryBreakdown).map(([category, count]) => ({
    category,
    count,
    percentage: Math.round((count / stats.overview.totalBooksStarted) * 100)
  }))

  return (
    <div className="container mx-auto py-8">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost">Home</Button>
          </Link>
          <Link href="/books">
            <Button variant="ghost">Books</Button>
          </Link>
          <Link href="/leaderboard">
            <Button variant="ghost">Leaderboard</Button>
          </Link>
        </div>
        <form action="/api/auth/signout" method="post">
          <Button type="submit" variant="outline">Sign Out</Button>
        </form>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {stats.user.name}!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s your reading progress and achievements
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Books Started</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.overview.totalBooksStarted}</div>
                <p className="text-xs text-muted-foreground">
                  Total books in progress
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Books Completed</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.overview.totalBooksCompleted}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.overview.completionRate}% completion rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reading Streak</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.overview.readingStreak}</div>
                <p className="text-xs text-muted-foreground">
                  Days in a row
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Level Progress</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Level {stats.user.level}</div>
                <div className="mt-2">
                  <Progress value={levelProgress()} className="h-2" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.user.points} points
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Current Reading */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your latest reading progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.recentProgress.length > 0 ? (
                  stats.recentProgress.slice(0, 3).map((progress) => (
                    <div key={progress.id} className="flex items-start gap-3">
                      <div className="relative w-12 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {progress.book.coverImage ? (
                          <Image
                            src={progress.book.coverImage}
                            alt={progress.book.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <BookOpen className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {progress.book.title}
                          </h4>
                          <Badge 
                            className={`${getStatusColor(progress.status)} text-xs`}
                            variant="secondary"
                          >
                            {progress.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          by {progress.book.author}
                        </p>
                        {progress.progressPercentage > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Progress</span>
                              <span>{Math.round(progress.progressPercentage)}%</span>
                            </div>
                            <Progress value={progress.progressPercentage} className="h-1" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No reading activity yet</p>
                    <Link href="/books">
                      <Button size="sm" className="mt-2">
                        Start Reading
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Reading Status
                </CardTitle>
                <CardDescription>Your current reading overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.overview.totalBooksReading}
                    </div>
                    <p className="text-sm text-blue-600">Currently Reading</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {stats.overview.totalBooksPaused}
                    </div>
                    <p className="text-sm text-yellow-600">Paused</p>
                  </div>
                </div>
                
                {stats.overview.averageProgress > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Average Progress</span>
                      <span>{stats.overview.averageProgress}%</span>
                    </div>
                    <Progress value={stats.overview.averageProgress} className="h-2" />
                  </div>
                )}

                <div className="pt-4">
                  <Link href="/books">
                    <Button className="w-full">
                      Browse More Books
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          {/* Monthly Reading Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Monthly Reading Activity
              </CardTitle>
              <CardDescription>Books started and completed over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.monthlyStats.map((month, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{month.month}</span>
                      <span>{month.total} books</span>
                    </div>
                    <div className="flex gap-1 h-4">
                      <div 
                        className="bg-blue-500 rounded-l"
                        style={{ width: `${(month.started / Math.max(month.total, 1)) * 100}%` }}
                      />
                      <div 
                        className="bg-green-500 rounded-r"
                        style={{ width: `${(month.completed / Math.max(month.total, 1)) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{month.started} started</span>
                      <span>{month.completed} completed</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Started</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Completed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Reading Categories
              </CardTitle>
              <CardDescription>Your reading preferences by category</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <div className="space-y-4">
                  {categoryData.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{category.category}</span>
                        <span>{category.count} books ({category.percentage}%)</span>
                      </div>
                      <Progress value={category.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <PieChart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No reading data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          {/* Achievement Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Trophy className="w-8 h-8 text-yellow-600" />
                  <Badge variant="secondary">Unlocked</Badge>
                </div>
                <CardTitle className="text-lg">First Book</CardTitle>
                <CardDescription>Complete your first book</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Congratulations on completing your first book!
                </p>
              </CardContent>
            </Card>

            <Card className={stats.overview.readingStreak >= 7 ? "border-green-200 bg-green-50" : "border-gray-200"}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Activity className="w-8 h-8 text-green-600" />
                  <Badge variant={stats.overview.readingStreak >= 7 ? "secondary" : "outline"}>
                    {stats.overview.readingStreak >= 7 ? "Unlocked" : "Locked"}
                  </Badge>
                </div>
                <CardTitle className="text-lg">Week Warrior</CardTitle>
                <CardDescription>Read for 7 days in a row</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Current streak: {stats.overview.readingStreak} days
                </p>
              </CardContent>
            </Card>

            <Card className={stats.overview.totalBooksCompleted >= 5 ? "border-purple-200 bg-purple-50" : "border-gray-200"}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Star className="w-8 h-8 text-purple-600" />
                  <Badge variant={stats.overview.totalBooksCompleted >= 5 ? "secondary" : "outline"}>
                    {stats.overview.totalBooksCompleted >= 5 ? "Unlocked" : "Locked"}
                  </Badge>
                </div>
                <CardTitle className="text-lg">Bookworm</CardTitle>
                <CardDescription>Complete 5 books</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Progress: {stats.overview.totalBooksCompleted}/5 books
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}