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
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Hero Section */}
        <section className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Transform Reading Into an Adventure
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
            Join our educational platform where students discover amazing books, 
            share summaries, and compete in reading challenges.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Link href="/books">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                Start Reading
              </Button>
            </Link>
            <Link href="/books">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Browse Library
              </Button>
            </Link>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Books</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.totalBooks}</div>
              <p className="text-xs text-muted-foreground hidden sm:block">Available in library</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Active Readers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.activeReaders}</div>
              <p className="text-xs text-muted-foreground hidden sm:block">Reading this month</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Summaries</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.summariesShared}</div>
              <p className="text-xs text-muted-foreground hidden sm:block">By our community</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Reading Goal</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.readingGoalProgress}%</div>
              <Progress value={stats.readingGoalProgress} className="mt-2" />
            </CardContent>
          </Card>
        </section>

        {/* Featured Books */}
        <section className="mb-8 sm:mb-12">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Featured Books</h3>
          {books.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {books.map((book) => (
                <Card key={book.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg leading-tight line-clamp-2">
                          {book.title}
                        </CardTitle>
                        <CardDescription className="text-sm mt-1">
                          by {book.author}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {book.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                      {book.description || 'A captivating story that will keep you engaged from start to finish.'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {book._count?.readingProgress || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {book._count?.summaries || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {book.pages || 'Unknown'} pages
                      </Badge>
                      <Link href={`/books/${book.id}`}>
                        <Button size="sm" className="text-xs px-3">
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
              <CardContent className="text-center py-8 sm:py-12">
                <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Books Available</h4>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">
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
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="text-center sm:text-left">
              <div className="flex justify-center sm:justify-start mb-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <CardTitle className="text-lg sm:text-xl">Reading Challenges</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Compete with classmates and earn achievements
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="text-center sm:text-left">
              <div className="flex justify-center sm:justify-start mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-lg sm:text-xl">Social Reading</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Share summaries and discuss with friends
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
            <CardHeader className="text-center sm:text-left">
              <div className="flex justify-center sm:justify-start mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-lg sm:text-xl">Progress Tracking</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Monitor your reading journey and improvements
              </CardDescription>
            </CardHeader>
          </Card>
        </section>
      </main>
    </div>
  );
}
