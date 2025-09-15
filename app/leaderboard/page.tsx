"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Trophy, 
  Medal, 
  Award, 
  Users, 
  BookOpen, 
  Star, 
  TrendingUp,
  Calendar,
  Target,
  Activity,
  Crown
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface LeaderboardEntry {
  rank: number
  user: {
    id: string
    name: string
    email: string
    role: string
    avatar?: string
    level: number
  }
  stats: {
    points: number
    booksCompleted: number
    booksReading: number
    totalBooksStarted: number
    totalPagesRead: number
    summariesWritten: number
    averageSummaryRating: number
    readingStreak: number
    completionRate: number
  }
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[]
  metadata: {
    type: string
    period: string
    totalUsers: number
    totalBooksInLibrary: number
    totalReadingProgress: number
    lastUpdated: string
  }
}

export default function LeaderboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState("all")
  const [activeTab, setActiveTab] = useState("students")

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        type: activeTab,
        period: selectedPeriod,
        limit: "20"
      })

      const response = await fetch(`/api/leaderboard?${params}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
        setError(null)
      } else {
        setError("Failed to fetch leaderboard data")
      }
    } catch (err) {
      setError("An error occurred while fetching leaderboard")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [activeTab, selectedPeriod])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white"
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-600 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getCurrentUserRank = () => {
    if (!session?.user?.id || !data) return null
    return data.leaderboard.find(entry => entry.user.id === session.user.id)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading leaderboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-500">
          <p>{error || "Failed to load leaderboard"}</p>
          <Button onClick={fetchLeaderboard} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const currentUserRank = getCurrentUserRank()

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reading Leaderboard</h1>
        <p className="text-muted-foreground">
          See how you rank among fellow readers in our community
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
          </SelectContent>
        </Select>

        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Last updated: {new Date(data.metadata.lastUpdated).toLocaleTimeString()}
        </div>
      </div>

      {/* Current User Stats */}
      {currentUserRank && (
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Your Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`px-3 py-1 rounded-full ${getRankBadgeColor(currentUserRank.rank)}`}>
                <span className="font-bold">#{currentUserRank.rank}</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold">{currentUserRank.user.name}</p>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{currentUserRank.stats.points} points</span>
                  <span>{currentUserRank.stats.booksCompleted} books completed</span>
                  <span>{currentUserRank.stats.readingStreak} day streak</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="all">Everyone</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total {activeTab}</p>
                    <p className="text-2xl font-bold">{data.metadata.totalUsers}</p>
                  </div>
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Books in Library</p>
                    <p className="text-2xl font-bold">{data.metadata.totalBooksInLibrary}</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reading Activities</p>
                    <p className="text-2xl font-bold">{data.metadata.totalReadingProgress}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Period</p>
                    <p className="text-lg font-bold capitalize">{selectedPeriod}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          <div className="space-y-3">
            {data.leaderboard.map((entry) => (
              <Card 
                key={entry.user.id} 
                className={`${entry.rank <= 3 ? 'ring-2 ring-primary/20' : ''} ${
                  entry.user.id === session?.user?.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex flex-col items-center">
                      {getRankIcon(entry.rank)}
                      <Badge className={`mt-1 ${getRankBadgeColor(entry.rank)}`}>
                        #{entry.rank}
                      </Badge>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={entry.user.avatar} />
                        <AvatarFallback>
                          {entry.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{entry.user.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {entry.user.role}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Level {entry.user.level}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {entry.stats.points} points • {entry.stats.booksCompleted} books completed
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-sm font-medium">{entry.stats.totalPagesRead}</p>
                        <p className="text-xs text-muted-foreground">Pages</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{entry.stats.summariesWritten}</p>
                        <p className="text-xs text-muted-foreground">Summaries</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{entry.stats.readingStreak}</p>
                        <p className="text-xs text-muted-foreground">Streak</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{entry.stats.completionRate}%</p>
                        <p className="text-xs text-muted-foreground">Completion</p>
                      </div>
                    </div>

                    {/* Rating */}
                    {entry.stats.averageSummaryRating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">
                          {entry.stats.averageSummaryRating}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {data.leaderboard.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No data available</h3>
                <p className="text-muted-foreground">
                  No reading activity found for the selected period.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}