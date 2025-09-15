import prisma from '../lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Trophy, Star, TrendingUp } from "lucide-react";
import { auth } from "@/auth";
import Link from "next/link";

async function getBooks() {
  try {
    console.log('Attempting to fetch books from database...');
    const books = await prisma.book.findMany({
      take: 6, // Limit to 6 featured books
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: {
            readingProgress: true,
            summaries: true,
            likes: true
          }
        }
      }
    });
    console.log('Successfully fetched books:', books.length);
    return books;
  } catch (error) {
    // Log the actual error for debugging
    console.error('Error fetching books:', error);
    return [];
  }
}

async function getStats() {
  try {
    // Get current date for "this month" calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Fetch real statistics from database
    const [
      totalBooks,
      activeReaders,
      summariesShared,
      // totalUsers, // Unused for now
      completedBooksThisMonth,
      totalBooksStarted
    ] = await Promise.all([
      // Total books in library
      prisma.book.count(),
      
      // Active readers (users who have reading progress updated this month)
      prisma.user.count({
        where: {
          readingProgress: {
            some: {
              updatedAt: {
                gte: startOfMonth
              }
            }
          }
        }
      }),
      
      // Total summaries shared
      prisma.summary.count({
        where: {
          isPublic: true
        }
      }),
      
      // Total users for goal calculation
      // prisma.user.count(), // Unused for now
      
      // Books completed this month
      prisma.readingProgress.count({
        where: {
          status: "COMPLETED",
          completedAt: {
            gte: startOfMonth
          }
        }
      }),
      
      // Total books started by all users
      prisma.readingProgress.count({
        where: {
          status: {
            not: "NOT_STARTED"
          }
        }
      })
    ]);

    // Calculate reading goal progress (completion rate this month)
    // If no books started, use overall completion rate
    let readingGoalProgress = 0;
    if (totalBooksStarted > 0) {
      readingGoalProgress = Math.round((completedBooksThisMonth / Math.max(activeReaders, 1)) * 100);
      // Cap at 100%
      readingGoalProgress = Math.min(readingGoalProgress, 100);
    }

    return {
      totalBooks,
      activeReaders,
      summariesShared,
      readingGoalProgress
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    // Return fallback stats if database query fails
    return {
      totalBooks: 0,
      activeReaders: 0,
      summariesShared: 0,
      readingGoalProgress: 0
    };
  }
}

export default async function Home() {
  const session = await auth();
  const books = await getBooks();
  const stats = await getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">EduRead Platform</h1>
            </div>
            <div className="flex items-center space-x-2">
              {session ? (
                <>
                  <span className="text-sm text-gray-600">Welcome, {session.user?.name}</span>
                  <Link href="/books">
                    <Button variant="ghost">Books</Button>
                  </Link>
                  <Link href="/leaderboard">
                    <Button variant="ghost">Leaderboard</Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                  <form action="/api/auth/signout" method="post">
                    <Button type="submit" variant="outline">Sign Out</Button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/auth/signin">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/books">
                    <Button variant="outline">Browse Books</Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Transform Reading Into an Adventure
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join our educational platform where students discover amazing books, 
            share summaries, and compete in reading challenges.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/books">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Start Reading
              </Button>
            </Link>
            <Link href="/books">
              <Button size="lg" variant="outline">
                Browse Library
              </Button>
            </Link>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Books</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBooks}</div>
              <p className="text-xs text-muted-foreground">Available in library</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Readers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeReaders}</div>
              <p className="text-xs text-muted-foreground">Reading this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Summaries Shared</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.summariesShared}</div>
              <p className="text-xs text-muted-foreground">By our community</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reading Goal</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.readingGoalProgress}%</div>
              <Progress value={stats.readingGoalProgress} className="mt-2" />
            </CardContent>
          </Card>
        </section>

        {/* Featured Books */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Featured Books</h3>
          {books.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book) => (
                <Card key={book.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{book.title}</CardTitle>
                        <CardDescription>by {book.author}</CardDescription>
                      </div>
                      <Badge variant="secondary">{book.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {book.description || 'A captivating story that will keep you engaged from start to finish.'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {book._count?.readingProgress || 0} readers
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {book._count?.summaries || 0} summaries
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">
                        {book.pages || 'Unknown'} pages
                      </Badge>
                      <Link href={`/books/${book.id}`}>
                        <Button size="sm">
                          Start Reading
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Books Available</h4>
                <p className="text-gray-600 mb-4">
                  The library is being prepared. Check back soon for amazing books!
                </p>
                <Link href="/books">
                  <Button variant="outline">Browse Catalog</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Features Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Trophy className="h-8 w-8 text-yellow-600 mb-2" />
              <CardTitle>Reading Challenges</CardTitle>
              <CardDescription>
                Compete with classmates and earn achievements
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Social Reading</CardTitle>
              <CardDescription>
                Share summaries and discuss with friends
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Progress Tracking</CardTitle>
              <CardDescription>
                Monitor your reading journey and improvements
              </CardDescription>
            </CardHeader>
          </Card>
        </section>
      </main>
    </div>
  );
}
