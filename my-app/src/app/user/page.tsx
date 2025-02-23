"use client";

import { useState, useEffect } from "react";
import {
  BellIcon,
  HomeIcon,
  SearchIcon,
  Settings,
  UserCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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

// Define the Customer interface
interface Customer {
  id?: string;
  first_name: string;
  last_name: string;
  cc: string;
  street: string;
  city: string;
  state: string;
  zip: number;
  lat: number;
  long: number;
  job: string;
  dob: string;
  gender: string;
  is_locked: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

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
          href="/admin"
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
  );
}

export default function DashboardPage() {
  // Initialize active link as "user-profiles" so the User Profiles nav item is highlighted on page load.
  const [activeLink, setActiveLink] = useState("user-profiles");
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    async function fetchCustomer() {
      const { data, error } = await supabase
        .from("customer")
        .select("*")
        .limit(1)
        .single();
      if (error) {
        console.error("Error fetching customer data:", error);
        return;
      }
      setCustomer(data);
    }
    fetchCustomer();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activeLink={activeLink} setActiveLink={setActiveLink} />
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center border-b border-gray-200 bg-white px-6">
          <h1 className="text-2xl font-semibold">User Profile</h1>
          <div className="ml-auto flex items-center gap-4">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search here ..."
                className="w-[300px] bg-white pl-8"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <BellIcon className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar>
                  <AvatarImage src="/jett.webp" />
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
        <div className="flex h-[calc(100%-4rem)] bg-gray-50">
          <main className="flex-1 p-6 overflow-auto">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Name
                        </div>
                        <div className="text-2xl font-bold">
                          {customer
                            ? `${customer.first_name} ${customer.last_name}`
                            : "Loading..."}
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Date of Birth
                          </div>
                          <div>
                            {customer ? customer.dob : "YYYY-MM-DD"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Occupation
                          </div>
                          <div>
                            {customer ? customer.job : "Occupation"}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Address
                        </div>
                        <div>{customer ? customer.street : "Street Name"}</div>
                        <div>{customer ? customer.city : "City"}</div>
                        <div>
                          {customer
                            ? `${customer.state}, ${customer.zip}`
                            : "State, Zip Code"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2 mt-6">
                  <Button
                    variant="outline"
                    className="rounded-full border-gray-500 text-gray-500"
                  >
                    <span className="mr-1.5 h-2 w-2 rounded-full bg-gray-500" />
                    Reset
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full border-blue-500 text-blue-500"
                  >
                    <span className="mr-1.5 h-2 w-2 rounded-full bg-blue-500" />
                    No Fraud
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full border-orange-500 text-orange-500"
                  >
                    <span className="mr-1.5 h-2 w-2 rounded-full bg-orange-500" />
                    Low Fraud
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full border-red-500 text-red-500"
                  >
                    <span className="mr-1.5 h-2 w-2 rounded-full bg-red-500" />
                    High Fraud
                  </Button>
                </div>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>My Card</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="aspect-video w-96 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300" />
                      <div>
                        <div className="mb-2 text-lg font-medium">
                          Recent transactions
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div>store</div>
                            <div className="text-sm text-muted-foreground">
                              location
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-red-500">-$3.56</div>
                            <div className="text-sm text-red-500">
                              Risk: high
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Live Transcript */}
              <aside className="w-full border-l p-6">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Live Transcript</h2>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="h-4 w-48 rounded bg-muted" />
                  </div>
                </div>
              </aside>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
