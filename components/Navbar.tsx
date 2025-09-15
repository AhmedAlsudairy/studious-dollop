'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Menu,
  X,
  User,
  Trophy,
  BarChart3,
  LogOut,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const navigation = [
    { name: 'Books', href: '/books', icon: BookOpen },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  ];

  return (
    <header className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <BookOpen className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-gray-900 hidden sm:block">
              EduRead Platform
            </span>
            <span className="text-xl font-bold text-gray-900 sm:hidden">
              EduRead
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Button>
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-2">
            {status === 'loading' ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            ) : session ? (
              <div className="relative">
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-2 px-2"
                  onClick={toggleUserMenu}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user?.image || ''} />
                    <AvatarFallback>
                      {session.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {session.user?.name || 'User'}
                  </span>
                </Button>
                
                {/* User Menu Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border rounded-md shadow-lg z-50">
                    <div className="py-1">
                      <Link 
                        href="/dashboard" 
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                      <Link 
                        href="/dashboard" 
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={() => {
                          signOut();
                          setIsUserMenuOpen(false);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/signin">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="flex items-center space-x-2">
                    <UserPlus className="h-4 w-4" />
                    <span>Get Started</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Navigation Links */}
              {navigation.map((item) => (
                <Link key={item.name} href={item.href} onClick={closeMobileMenu}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start flex items-center space-x-3 px-3 py-2"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              ))}

              {/* Auth Section */}
              <div className="pt-4 border-t">
                {status === 'loading' ? (
                  <div className="px-3 py-2">
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                  </div>
                ) : session ? (
                  <div className="space-y-1">
                    <div className="px-3 py-2 border-b">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={session.user?.image || ''} />
                          <AvatarFallback>
                            {session.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {session.user?.name || 'User'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {session.user?.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Link href="/dashboard" onClick={closeMobileMenu}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start flex items-center space-x-3 px-3 py-2"
                      >
                        <User className="h-5 w-5" />
                        <span>Profile</span>
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        signOut();
                        closeMobileMenu();
                      }}
                      className="w-full justify-start flex items-center space-x-3 px-3 py-2 text-red-600 hover:text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Sign Out</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Link href="/auth/signin" onClick={closeMobileMenu}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start flex items-center space-x-3 px-3 py-2"
                      >
                        <LogIn className="h-5 w-5" />
                        <span>Sign In</span>
                      </Button>
                    </Link>
                    <Link href="/auth/register" onClick={closeMobileMenu}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start flex items-center space-x-3 px-3 py-2"
                      >
                        <UserPlus className="h-5 w-5" />
                        <span>Get Started</span>
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay to close user menu when clicking outside */}
      {isUserMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </header>
  );
}