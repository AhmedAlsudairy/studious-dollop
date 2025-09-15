"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Search, BookOpen, Users, Star, Plus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Book {
  id: string
  title: string
  author: string
  description?: string
  coverImage?: string
  category: string
  pages?: number
  difficulty?: string
  readingProgress: Array<{
    id: string
    status: string
    progressPercentage: number
    userId: string
  }>
  _count: {
    readingProgress: number
    summaries: number
    comments: number
    likes: number
  }
}

interface BooksResponse {
  success: boolean
  data: {
    books: Book[]
    pagination: {
      page: number
      limit: number
      totalCount: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
}

export default function BooksPage() {
  const { data: session } = useSession()
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<{
    page: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null)

  // Fetch books
  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12"
      })

      if (search) params.append("search", search)
      if (selectedCategory) params.append("category", selectedCategory)
      if (selectedDifficulty) params.append("difficulty", selectedDifficulty)

      const response = await fetch(`/api/books?${params}`)
      const data: BooksResponse = await response.json()

      if (data.success) {
        setBooks(data.data.books)
        setPagination(data.data.pagination)
      } else {
        setError("Failed to fetch books")
      }
    } catch (err) {
      setError("An error occurred while fetching books")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [currentPage, search, selectedCategory, selectedDifficulty])  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/books/categories")
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  // Get user's reading progress for a book
  const getUserProgress = (book: Book) => {
    if (!session?.user?.id) return null
    return book.readingProgress.find(progress => progress.userId === session.user.id)
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-500"
      case "READING": return "bg-blue-500"
      case "PAUSED": return "bg-yellow-500"
      default: return "bg-gray-500"
    }
  }

  const canManageBooks = session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN"

  if (loading && books.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading books...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-500">
          <p>{error}</p>
          <Button onClick={fetchBooks} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Books Library</h1>
          <p className="text-muted-foreground">
            Discover and track your reading journey
          </p>
        </div>
        {canManageBooks && (
          <Link href="/books/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Book
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search books, authors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedDifficulty || "all"} onValueChange={(value) => setSelectedDifficulty(value === "all" ? "" : value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books.map((book) => {
          const userProgress = getUserProgress(book)
          return (
            <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48 bg-gray-100">
                {book.coverImage ? (
                  <Image
                    src={book.coverImage}
                    alt={book.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <BookOpen className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                {userProgress && (
                  <Badge 
                    className={`absolute top-2 right-2 ${getStatusColor(userProgress.status)}`}
                  >
                    {userProgress.status === "NOT_STARTED" ? "New" : userProgress.status}
                  </Badge>
                )}
              </div>
              
              <CardHeader className="pb-3">
                <CardTitle className="text-lg line-clamp-2">{book.title}</CardTitle>
                <CardDescription className="text-sm">by {book.author}</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <Badge variant="secondary">{book.category}</Badge>
                    {book.difficulty && (
                      <Badge variant="outline">{book.difficulty}</Badge>
                    )}
                  </div>
                  
                  {book.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {book.description}
                    </p>
                  )}
                  
                  {userProgress && userProgress.progressPercentage > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{Math.round(userProgress.progressPercentage)}%</span>
                      </div>
                      <Progress value={userProgress.progressPercentage} className="h-2" />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {book._count.readingProgress}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {book._count.summaries}
                      </span>
                    </div>
                    {book.pages && (
                      <span>{book.pages} pages</span>
                    )}
                  </div>
                  
                  <Link href={`/books/${book.id}`}>
                    <Button className="w-full" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={!pagination.hasPrev}
          >
            Previous
          </Button>
          <span className="mx-4 text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!pagination.hasNext}
          >
            Next
          </Button>
        </div>
      )}

      {books.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No books found</h3>
          <p className="text-muted-foreground">
            {search || selectedCategory || selectedDifficulty
              ? "Try adjusting your filters"
              : "No books available yet"}
          </p>
        </div>
      )}
    </div>
  )
}