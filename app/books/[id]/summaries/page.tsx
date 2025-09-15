"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  MessageSquare,
  Star,
  User,
  Plus,
  ArrowLeft,
  Award,
  BookOpen
} from "lucide-react"
import Link from "next/link"

interface Summary {
  id: string
  content: string
  rating?: number
  ratedBy?: string
  ratedAt?: string
  createdAt: string
  author: {
    id: string
    name: string
    role: string
  }
  feedback?: string
}

interface Book {
  id: string
  title: string
  author: string
  coverImage?: string
  category: string
  summaries: Summary[]
}

interface BookSummariesPageProps {
  params: Promise<{ id: string }>
}

export default function BookSummariesPage({ params }: BookSummariesPageProps) {
  const resolvedParams = React.use(params)
  const { data: session } = useSession()
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submittingSummary, setSubmittingSummary] = useState(false)

  // Summary state
  const [summaryContent, setSummaryContent] = useState("")
  const [summaryTitle, setSummaryTitle] = useState("")
  const [showSummaryDialog, setShowSummaryDialog] = useState(false)

  // Rating state
  const [ratingContent, setRatingContent] = useState("")
  const [ratingScore, setRatingScore] = useState<number>(5)
  const [ratingSummaryId, setRatingSummaryId] = useState<string>("")
  const [showRatingDialog, setShowRatingDialog] = useState(false)

  const fetchBook = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/books/${resolvedParams.id}`)
      const data = await response.json()

      if (data.success) {
        setBook(data.data)
      } else {
        setError("Failed to fetch book details")
      }
    } catch (err) {
      setError("An error occurred while fetching book details")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [resolvedParams.id])

  useEffect(() => {
    if (resolvedParams.id) {
      fetchBook()
    }
  }, [resolvedParams.id, fetchBook])

  const submitSummary = async () => {
    if (!session?.user?.id || !book || !summaryContent.trim()) return

    try {
      setSubmittingSummary(true)
      const response = await fetch("/api/summaries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookId: book.id,
          title: summaryTitle.trim() || undefined, // Optional title
          content: summaryContent.trim(),
        }),
      })

      const data = await response.json()
      if (data.success) {
        setSummaryContent("")
        setSummaryTitle("")
        setShowSummaryDialog(false)
        await fetchBook() // Refresh book data
      } else {
        alert(`Failed to submit summary: ${data.error || "Unknown error"}`)
      }
    } catch (err) {
      console.error("Error submitting summary:", err)
      alert("An error occurred while submitting summary")
    } finally {
      setSubmittingSummary(false)
    }
  }

  const rateSummary = async () => {
    if (!session?.user?.id || !ratingSummaryId || session.user.role !== "TEACHER") return

    try {
      const response = await fetch(`/api/summaries/${ratingSummaryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: ratingScore,
          feedback: ratingContent.trim() || undefined,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setRatingContent("")
        setRatingScore(5)
        setRatingSummaryId("")
        setShowRatingDialog(false)
        await fetchBook() // Refresh book data
      } else {
        alert("Failed to rate summary")
      }
    } catch (err) {
      console.error("Error rating summary:", err)
      alert("An error occurred while rating summary")
    }
  }

  const getUserSummary = () => {
    if (!session?.user?.id || !book) return null
    return book.summaries.find(summary => summary.author.id === session.user.id)
  }

  const canRateSummaries = session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN"

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading summaries...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-500">
          <p>{error || "Book not found"}</p>
          <Link href="/books">
            <Button className="mt-4">Back to Books</Button>
          </Link>
        </div>
      </div>
    )
  }

  const userSummary = getUserSummary()

  return (
    <div className="container mx-auto py-8">
      {/* Navigation */}
      <div className="mb-6">
        <Link href={`/books/${book.id}`}>
          <Button variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Book
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4">
          <div className="relative w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
            {book.coverImage ? (
              <Image
                src={book.coverImage}
                alt={book.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <BookOpen className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Book Summaries</h1>
            <p className="text-xl text-muted-foreground mb-2">{book.title}</p>
            <p className="text-muted-foreground">by {book.author}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Summary */}
        <div className="lg:col-span-2 space-y-6">
          {session && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  My Summary
                </CardTitle>
                <CardDescription>
                  Share your thoughts and analysis of this book
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userSummary ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">Your Summary</span>
                        {userSummary.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{userSummary.rating}/10</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm mb-3 whitespace-pre-wrap">{userSummary.content}</p>
                      {userSummary.feedback && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                          <p className="text-sm font-medium text-blue-800">Teacher Feedback:</p>
                          <p className="text-sm text-blue-700 mt-1">{userSummary.feedback}</p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-3">
                        Submitted on {new Date(userSummary.createdAt).toLocaleDateString()}
                        {userSummary.ratedAt && (
                          <span> • Rated on {new Date(userSummary.ratedAt).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Write Your Summary</h3>
                    <p className="text-muted-foreground mb-6">
                      Share your thoughts, key takeaways, and analysis of this book
                    </p>
                    <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Write Summary
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Write Book Summary</DialogTitle>
                          <DialogDescription>
                            Share your thoughts, key takeaways, and summary of &quot;{book.title}&quot;
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="summaryTitle">Summary Title (Optional)</Label>
                            <Input
                              id="summaryTitle"
                              placeholder={`My thoughts on &quot;${book.title}&quot;`}
                              value={summaryTitle}
                              onChange={(e) => setSummaryTitle(e.target.value)}
                              className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Leave empty to auto-generate a title
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="summary">Your Summary</Label>
                            <Textarea
                              id="summary"
                              placeholder="Write your book summary here... Include key themes, characters, plot points, lessons learned, and your personal thoughts."
                              value={summaryContent}
                              onChange={(e) => setSummaryContent(e.target.value)}
                              rows={8}
                              className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Take your time to write a thoughtful summary. Teachers will rate your work.
                            </p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => {
                            setShowSummaryDialog(false);
                            setSummaryContent('');
                            setSummaryTitle('');
                          }}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={submitSummary} 
                            disabled={submittingSummary || !summaryContent.trim()}
                          >
                            {submittingSummary ? "Submitting..." : "Submit Summary"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* All Summaries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Student Summaries ({book.summaries.length})
              </CardTitle>
              <CardDescription>
                Read what others think about this book
              </CardDescription>
            </CardHeader>
            <CardContent>
              {book.summaries.length > 0 ? (
                <div className="space-y-6">
                  {book.summaries.map((summary) => (
                    <div key={summary.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{summary.author.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {summary.author.role}
                          </Badge>
                        </div>
                        {summary.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{summary.rating}/10</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {summary.content}
                      </p>
                      
                      {summary.feedback && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                          <p className="text-sm font-medium text-blue-800">Teacher Feedback:</p>
                          <p className="text-sm text-blue-700 mt-1">{summary.feedback}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(summary.createdAt).toLocaleDateString()}
                          {summary.ratedAt && (
                            <span> • Rated {new Date(summary.ratedAt).toLocaleDateString()}</span>
                          )}
                        </span>
                        {canRateSummaries && !summary.rating && summary.author.id !== session?.user?.id && (
                          <Dialog open={showRatingDialog && ratingSummaryId === summary.id} onOpenChange={(open) => {
                            setShowRatingDialog(open)
                            if (!open) setRatingSummaryId("")
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setRatingSummaryId(summary.id)}
                              >
                                <Star className="w-3 h-3 mr-1" />
                                Rate
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Rate Summary</DialogTitle>
                                <DialogDescription>
                                  Rate this summary by {summary.author.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="rating">Rating (1-10)</Label>
                                  <Select value={ratingScore.toString()} onValueChange={(value) => setRatingScore(parseInt(value))}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {[1,2,3,4,5,6,7,8,9,10].map((num) => (
                                        <SelectItem key={num} value={num.toString()}>
                                          {num}/10 {num <= 3 ? "Poor" : num <= 5 ? "Fair" : num <= 7 ? "Good" : num <= 9 ? "Excellent" : "Outstanding"}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="feedback">Feedback (Optional)</Label>
                                  <Textarea
                                    id="feedback"
                                    placeholder="Provide constructive feedback on this summary..."
                                    value={ratingContent}
                                    onChange={(e) => setRatingContent(e.target.value)}
                                    rows={4}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => {
                                  setShowRatingDialog(false)
                                  setRatingSummaryId("")
                                }}>
                                  Cancel
                                </Button>
                                <Button onClick={rateSummary}>
                                  Submit Rating
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No summaries yet</h3>
                  <p className="text-muted-foreground">
                    Be the first to share your thoughts about this book!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Summaries</span>
                <span className="font-medium">{book.summaries.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rated Summaries</span>
                <span className="font-medium">
                  {book.summaries.filter(s => s.rating).length}
                </span>
              </div>
              {book.summaries.filter(s => s.rating).length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Average Rating</span>
                  <span className="font-medium">
                    {(book.summaries.reduce((sum, s) => sum + (s.rating || 0), 0) / 
                      book.summaries.filter(s => s.rating).length).toFixed(1)}/10
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {session && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/books/${book.id}`}>
                  <Button variant="outline" className="w-full">
                    <BookOpen className="w-4 h-4 mr-2" />
                    View Book Details
                  </Button>
                </Link>
                {!userSummary && (
                  <Button 
                    className="w-full"
                    onClick={() => setShowSummaryDialog(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Write Summary
                  </Button>
                )}
                {canRateSummaries && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">
                      As a teacher, you can rate student summaries
                    </p>
                    <Badge variant="secondary" className="w-full justify-center">
                      <Award className="w-3 h-3 mr-1" />
                      Teacher Access
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}