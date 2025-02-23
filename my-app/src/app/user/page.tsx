"use client"

import { BellIcon, HomeIcon, SearchIcon, Settings, UserCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Sidebar Component: Combines Banklytics branding and navigation
function Sidebar({ activeLink, setActiveLink }: { activeLink: string; setActiveLink: React.Dispatch<React.SetStateAction<string>> }) {
  return (
    <aside className="h-full w-60 border-r border-gray-200 bg-white">
      {/* Banklytics Branding */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png" // Ensure your logo file is in the /public folder
            alt="Banklytics Logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <span className="text-2xl font-semibold">Banklytics</span>
        </div>
      </div>
      {/* Navigation Links */}
      <nav className="flex h-full flex-col p-4">
        <Link
          href="#"
          onClick={() => setActiveLink("dashboard")}
          className={`mb-1 flex items-center gap-2 rounded-lg px-4 py-2 ${
            activeLink === "dashboard"
              ? "bg-[#E5F3FF] text-sky-600"
              : "text-gray-500 hover:bg-[#E5F3FF] hover:text-sky-600"
          }`}
        >
          <HomeIcon className="h-5 w-5" />
          Dashboard
        </Link>
        <Link
          href="/user"
          onClick={() => setActiveLink("user-profiles")}
          className={`mb-1 flex items-center gap-2 rounded-lg px-4 py-2 ${
            activeLink === "user-profiles"
              ? "bg-[#E5F3FF] text-sky-600"
              : "text-gray-500 hover:bg-[#E5F3FF] hover:text-sky-600"
          }`}
        >
          <UserCircle className="h-5 w-5" />
          User Profiles
        </Link>
        <Link
          href="#"
          onClick={() => setActiveLink("settings")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 ${
            activeLink === "settings"
              ? "bg-[#E5F3FF] text-sky-600"
              : "text-gray-500 hover:bg-[#E5F3FF] hover:text-sky-600"
          }`}
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
      </nav>
    </aside>
  )
}

function TopBar() {
  return (
    <header className="flex h-16 items-center border-b border-gray-200 bg-white px-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="ml-auto flex items-center gap-4">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search here ..." className="w-[300px] bg-white pl-8" />
        </div>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default function DashboardPage() {
  const [activeLink, setActiveLink] = useState("dashboard")

  return (
    <div className="h-screen bg-background overflow-hidden">
      <div className="flex flex-col h-full">
        <TopBar />
        <div className="flex flex-1">
          {/* Left Sidebar */}
          <Sidebar activeLink={activeLink} setActiveLink={setActiveLink} />
          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            <div className="grid gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="text-sm text-muted-foreground">Name</div>
                      <div className="text-2xl font-bold">Lisa Lin</div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-sm text-muted-foreground">Date of Birth</div>
                        <div>YYYY-MM-DD</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Occupation</div>
                        <div>YYYY-MM-DD</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Address</div>
                      <div>Street Name</div>
                      <div>City</div>
                      <div>State, Zip Code</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Badge variant="outline" className="rounded-full border-blue-500 text-blue-500">
                  <span className="mr-1.5 h-2 w-2 rounded-full bg-blue-500" />
                  No Fraud
                </Badge>
                <Badge variant="outline" className="rounded-full border-orange-500 text-orange-500">
                  <span className="mr-1.5 h-2 w-2 rounded-full bg-orange-500" />
                  Low Fraud
                </Badge>
                <Badge variant="outline" className="rounded-full border-red-500 text-red-500">
                  <span className="mr-1.5 h-2 w-2 rounded-full bg-red-500" />
                  High Fraud
                </Badge>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>My Card</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="aspect-video w-96 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300" />
                    <div>
                      <div className="mb-2 text-lg font-medium">Recent transactions</div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div>store</div>
                          <div className="text-sm text-muted-foreground">location</div>
                        </div>
                        <div className="text-right">
                          <div className="text-red-500">-$3.56</div>
                          <div className="text-sm text-red-500">Risk: high</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
          {/* Right Sidebar */}
          <aside className="w-80 border-l p-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Live Transcript</h2>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="h-4 w-48 rounded bg-muted" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
