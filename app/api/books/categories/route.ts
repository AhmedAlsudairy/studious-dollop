import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

// Get all unique book categories
export async function GET() {
  try {
    const categories = await prisma.book.findMany({
      select: {
        category: true,
      },
      distinct: ['category'],
      orderBy: {
        category: 'asc',
      },
    })

    const categoryList = categories.map((item: { category: string }) => item.category)

    return NextResponse.json({
      success: true,
      data: categoryList,
    })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    )
  }
}

// Create or update a book with a new category
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Only teachers and admins can manage categories
    if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const { category } = await request.json()

    if (!category || typeof category !== 'string') {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      )
    }

    // Check if category already exists
    const existingCategory = await prisma.book.findFirst({
      where: {
        category: category.trim(),
      },
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 409 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Category validated and ready for use",
      data: { category: category.trim() },
    })
  } catch (error) {
    console.error("Error validating category:", error)
    return NextResponse.json(
      { error: "Failed to validate category" },
      { status: 500 }
    )
  }
}