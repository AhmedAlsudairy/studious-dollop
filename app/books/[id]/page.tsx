"use client"

import React, { useState, useEffect, use, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { BookOpen, Users, Star, Calendar, Edit, Trash2, ArrowLeft, MessageSquare } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Book {
  id: string
  title: string
  author: string
  description?: string
  coverImage?: string
  isbn?: string
  category: string
  pages?: number
  language: string
  publishedAt?: string
  difficulty?: string
  createdAt: string
  readingProgress: Array<{
    id: string
    status: string
    progressPercentage: number
    currentPage: number
    startedAt?: string
    completedAt?: string
    user: {
      id: string
      name: string
      email: string
    }
  }>
  summaries: Array<{
    id: string
    title: string
    content: string
    rating: number
    views: number
    author: {
      id: string
      name: string
      email: string
    }
    _count: {
      likes: number
      comments: number
    }
  }>
  comments: Array<{
    id: string
    content: string
    createdAt: string
    author: {
      id: string
      name: string
      email: string
    }
  }>
  _count: {
    readingProgress: number
    summaries: number
    comments: number
    likes: number
  }
}

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { data: session } = useSession()
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingProgress, setUpdatingProgress] = useState(false)
  
  // Progress tracking
  const [currentPage, setCurrentPage] = useState(0)
  const [readingStatus, setReadingStatus] = useState("NOT_STARTED")

  const fetchBook = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/books/${resolvedParams.id}`)
      const data = await response.json()

      if (data.success) {
        setBook(data.data)
        
        // Set current user's progress if exists
        if (session?.user?.id) {
          const userProgress = data.data.readingProgress.find(
            (p: { user: { id: string }; currentPage: number; status: string }) => p.user.id === session.user.id
          )
          if (userProgress) {
            setCurrentPage(userProgress.currentPage)
            setReadingStatus(userProgress.status)
          } else {
            // Reset to defaults if no progress found
            setCurrentPage(0)
            setReadingStatus("NOT_STARTED")
          }
        }
      } else {
        setError("Book not found")
      }
    } catch (err) {
      setError("Failed to fetch book details")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [resolvedParams.id, session?.user?.id])

  const updateReadingProgress = async () => {
    if (!session?.user?.id || !book) return

    try {
      setUpdatingProgress(true)
      const response = await fetch("/api/reading-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookId: book.id,
          status: readingStatus,
          currentPage,
          totalPages: book.pages,
        }),
      })

      const data = await response.json()
      if (data.success) {
        // Refresh book data to get updated progress from database
        await fetchBook()
        
        // Update local state with the returned progress data
        if (data.data) {
          setCurrentPage(data.data.currentPage)
          setReadingStatus(data.data.status)
        }
      } else {
        setError("Failed to update reading progress")
      }
    } catch (err) {
      setError("Failed to update reading progress")
      console.error(err)
    } finally {
      setUpdatingProgress(false)
    }
  }

  useEffect(() => {
    fetchBook()
  }, [fetchBook])

  const getUserProgress = () => {
    if (!session?.user?.id || !book) return null
    return book.readingProgress.find(p => p.user.id === session.user.id)
  }

  const canManageBooks = session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN"
  const canDeleteBooks = session?.user?.role === "ADMIN"

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading book details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Book not found"}</p>
          <Link href="/books">
            <Button>Back to Books</Button>
          </Link>
        </div>
      </div>
    )
  }

  const userProgress = getUserProgress()
  // Use database progress if available, otherwise calculate from current state
  const progressPercentage = userProgress?.progressPercentage ?? 
    (book.pages ? Math.min((currentPage / book.pages) * 100, 100) : 0)

  return (
    <div className="container mx-auto py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link href="/books">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Books
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Book Info */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Cover Image */}
            <div className="md:col-span-1">
              <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
                {book.coverImage ? (
                  <Image
                    src={book.coverImage}
                    alt={book.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <BookOpen className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Book Details */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
                  <p className="text-xl text-muted-foreground mb-4">by {book.author}</p>
                </div>
                {canManageBooks && (
                  <div className="flex gap-2">
                    <Link href={`/books/${book.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    {canDeleteBooks && (
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge>{book.category}</Badge>
                {book.difficulty && <Badge variant="secondary">{book.difficulty}</Badge>}
                <Badge variant="outline">{book.language}</Badge>
              </div>

              {book.description && (
                <p className="text-muted-foreground leading-relaxed">
                  {book.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                {book.pages && (
                  <div>
                    <span className="font-medium">Pages:</span> {book.pages}
                  </div>
                )}
                {book.isbn && (
                  <div>
                    <span className="font-medium">ISBN:</span> {book.isbn}
                  </div>
                )}
                {book.publishedAt && (
                  <div>
                    <span className="font-medium">Published:</span>{" "}
                    {new Date(book.publishedAt).toLocaleDateString()}
                  </div>
                )}
                <div>
                  <span className="font-medium">Language:</span> {book.language}
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {book._count.readingProgress} readers
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  {book._count.summaries} summaries
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {book.comments.length} comments
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reading Progress Sidebar */}
        <div className="lg:col-span-1">
          {session?.user && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Your Reading Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select value={readingStatus} onValueChange={setReadingStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                        <SelectItem value="READING">Reading</SelectItem>
                        <SelectItem value="PAUSED">Paused</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {book.pages && (
                    <div>
                      <label className="text-sm font-medium">Current Page</label>
                      <Input
                        type="number"
                        min="0"
                        max={book.pages}
                        value={currentPage}
                        onChange={(e) => setCurrentPage(parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  )}

                  <Button 
                    onClick={updateReadingProgress}
                    disabled={updatingProgress}
                    className="w-full"
                  >
                    {updatingProgress ? "Updating..." : "Update Progress"}
                  </Button>
                </div>

                {userProgress && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    {userProgress.startedAt && (
                      <p>Started: {new Date(userProgress.startedAt).toLocaleDateString()}</p>
                    )}
                    {userProgress.completedAt && (
                      <p>Completed: {new Date(userProgress.completedAt).toLocaleDateString()}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Book Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Book Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Total Readers</span>
                <span>{book._count.readingProgress}</span>
              </div>
              <div className="flex justify-between">
                <span>Summaries</span>
                <span>{book._count.summaries}</span>
              </div>
              <div className="flex justify-between">
                <span>Comments</span>
                <span>{book._count.comments}</span>
              </div>
              <div className="flex justify-between">
                <span>Likes</span>
                <span>{book._count.likes}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Summaries Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Reader Summaries</h2>
          <Link href={`/books/${book.id}/summaries`}>
            <Button variant="outline">
              View All Summaries ({book.summaries.length})
            </Button>
          </Link>
        </div>
        {book.summaries.length > 0 ? (
          <div className="grid gap-4">
            {book.summaries.slice(0, 3).map((summary) => (
              <Card key={summary.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{summary.title}</CardTitle>
                      <CardDescription>
                        by {summary.author.name} • {summary.views} views
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {summary.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{summary.rating}</span>
                        </div>
                      )}
                      <Badge variant="outline">
                        {summary._count.likes} likes
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3">
                    {summary.content}
                  </p>
                  <Link href={`/books/${book.id}/summaries`}>
                    <Button variant="link" className="p-0 mt-2">
                      Read all summaries
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
            {book.summaries.length > 3 && (
              <div className="text-center">
                <Link href={`/books/${book.id}/summaries`}>
                  <Button variant="outline">
                    View {book.summaries.length - 3} More Summaries
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No summaries yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to share your thoughts about this book!
              </p>
              <Link href={`/books/${book.id}/summaries`}>
                <Button>
                  Write First Summary
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Comments Section */}
      {book.comments.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Comments</h2>
          <div className="space-y-4">
            {book.comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {comment.author.name?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{comment.author.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}