"use client";

import { useState, useEffect } from "react";
import { Bell, Home, Search, Settings, User2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://default.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "defaultSupabaseKey";
const supabase = createClient(supabaseUrl, supabaseKey);

type Transaction = {
  merchant: string;
  category: string;
  trans_num: string;
  trans_date: string;
  trans_time: string;
  amt: number;
  merch_lat: number;
  merch_long: number;
  is_fraud: string;
  cc_num: string;
  user_id: string;
};

// Sidebar Component: Combines Banklytics branding and navigation
function Sidebar({
  activeLink,
  setActiveLink,
}: {
  activeLink: string;
  setActiveLink: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <aside className="h-full w-60 border-r border-gray-200 bg-white">
      {/* Banklytics Branding */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-3">
          {/* Logo Image */}
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
          <Home className="h-5 w-5" />
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
          <User2 className="h-5 w-5" />
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
  );
}

export default function Dashboard() {
  const [activeLink, setActiveLink] = useState("dashboard");
  const [updates, setUpdates] = useState<Transaction[]>([]);

  useEffect(() => {
    // Subscribe to realtime INSERT events on the "transaction" table
    const channel = supabase
      .channel("hacklytics")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transaction" },
        (payload) => {
          console.log("Realtime update received:", payload);
          const newUpdate = payload.new as Transaction;
          setUpdates((prev) => {
            // Prevent duplicate entries
            if (prev.find((update) => update.trans_num === newUpdate.trans_num)) {
              return prev;
            }
            return [...prev, newUpdate];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Component */}
      <Sidebar activeLink={activeLink} setActiveLink={setActiveLink} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center border-b border-gray-200 bg-white px-6">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <div className="ml-auto flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search here ..."
                className="w-[300px] bg-white pl-8"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
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

        {/* Main Content */}
        <main className="flex-1 bg-white p-6 overflow-auto">
          <div className="grid gap-6">
            {/* Middle row */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="rounded-lg border shadow-sm">
                <CardHeader className="border-b bg-white px-6 py-4">
                  <CardTitle>User Growth Trend</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[300px] rounded-lg bg-gray-50" />
                </CardContent>
              </Card>
              <Card className="rounded-lg border shadow-sm">
                <CardHeader className="border-b bg-white px-6 py-4">
                  <CardTitle>User Activity by Time of Day</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[300px] rounded-lg bg-gray-50" />
                </CardContent>
              </Card>
            </div>

            {/* Bottom row */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="rounded-lg border shadow-sm md:col-span-2">
                <CardHeader className="border-b bg-white px-6 py-4">
                  <CardTitle>User Demographics</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[300px] rounded-lg bg-gray-50" />
                </CardContent>
              </Card>
              <Card className="rounded-lg border shadow-sm">
                <CardHeader className="border-b bg-white px-6 py-4">
                  <CardTitle>Top User Locations</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[300px] rounded-lg bg-gray-50" />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
