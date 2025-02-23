"use client";

import { useState, useEffect } from "react";
import {
  BellIcon,
  HomeIcon,
  SearchIcon,
  Settings,
  UserCircle,
  LockIcon,
  UnlockIcon,
  ClockIcon,
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
import AudioRecorder from "@/components/audio";

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

interface Transaction {
  merchant: string;
  category: string;
  trans_num: string;
  trans_date: string;
  trans_time: string;
  amt: number;
  merch_lat: number;
  merch_long: number;
  is_fraud: string; // numeric string (0 to 1)
  cc_num: string;
  user_id: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

function getFraudRisk(score: number): string {
  if (score < 0.5) return "No Fraud";
  if (score < 0.7) return "Low Fraud";
  return "High Fraud";
}

function Sidebar({
  activeLink,
  setActiveLink,
}: {
  activeLink: string;
  setActiveLink: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <aside className="h-full bg-white border-r border-gray-200 w-60">
      {/* Banklytics Branding */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Banklytics Logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <span className="text-2xl font-semibold">Banklytics</span>
        </div>
      </div>
      {/* Navigation Links */}
      <nav className="flex flex-col h-full p-4">
        <Link
          href="/admin"
          onClick={() => setActiveLink("dashboard")}
          className={`mb-1 flex items-center gap-2 rounded-lg px-4 py-2 ${
            activeLink === "dashboard"
              ? "bg-[#E5F3FF] text-sky-600"
              : "text-gray-500 hover:bg-[#E5F3FF] hover:text-sky-600"
          }`}
        >
          <HomeIcon className="w-5 h-5" />
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
          <UserCircle className="w-5 h-5" />
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
          <Settings className="w-5 h-5" />
          Settings
        </Link>
      </nav>
    </aside>
  );
}

export default function DashboardPage() {
  const [activeLink, setActiveLink] = useState("user-profiles");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [recentTransaction, setRecentTransaction] = useState<Transaction | null>(null);

  // Fetch the customer record for Lisa Lin
  useEffect(() => {
    async function fetchCustomer() {
      const { data, error } = await supabase
        .from("customer")
        .select("*")
        .eq("first_name", "Lisa")
        .eq("last_name", "Lin")
        .single();
      if (error) {
        console.error("Error fetching customer data:", error);
        return;
      }
      setCustomer(data);
    }
    fetchCustomer();
  }, []);

  // Fetch the most recent transaction for the customer based on the credit card number (cc)
  async function fetchTransaction() {
    if (!customer) return;
    const { data, error } = await supabase
      .from("transaction")
      .select("*")
      .eq("cc_num", customer.cc)
      .order("trans_date", { ascending: false })
      .limit(1)
      .single();
    if (error) {
      console.error("Error fetching transaction data:", error);
      return;
    }
    setRecentTransaction(data);
  }

  // Re-fetch transaction data when customer info is available
  useEffect(() => {
    if (customer) {
      fetchTransaction();
    }
  }, [customer]);

  async function handleReset() {
    try {
      // Call your Next.js API route that proxies the request to your Python backend
      const response = await fetch("/api/reset", {
        method: "DELETE",
      });
  
      const contentType = response.headers.get("content-type");
      let result;
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        result = { message: "Non-JSON response", data: await response.text() };
      }
  
      if (!response.ok) {
        console.error("Reset failed:", result.error || result.message || result);
        return;
      }
  
      console.log("Reset succeeded:", result.success || result.message);
      // After resetting, re-fetch the latest transaction for Lisa Lin
      await fetchTransaction();
    } catch (error) {
      console.error("Error calling the reset API route:", error);
    }
  }
  

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activeLink={activeLink} setActiveLink={setActiveLink} />
      <div className="flex flex-col flex-1">
        <header className="flex items-center h-16 px-6 bg-white border-b border-gray-200">
          <h1 className="text-2xl font-semibold">User Profile</h1>
          <div className="flex items-center gap-4 ml-auto">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search here ..."
                className="w-[300px] bg-white pl-8"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <BellIcon className="w-5 h-5" />
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
                        <div className="text-sm text-muted-foreground">Name</div>
                        <div className="text-2xl font-bold">
                          {customer
                            ? `${customer.first_name} ${customer.last_name}`
                            : "Loading..."}
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <div className="text-sm text-muted-foreground">Date of Birth</div>
                          <div>{customer ? customer.dob : "YYYY-MM-DD"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Occupation</div>
                          <div>{customer ? customer.job : "Occupation"}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Address</div>
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
                    onClick={handleReset}
                  >
                    <span className="mr-1.5 h-2 w-2 rounded-full bg-gray-500" />
                    Reset
                  </Button>
                  <Button variant="outline" className="text-blue-500 border-blue-500 rounded-full">
                    <span className="mr-1.5 h-2 w-2 rounded-full bg-blue-500" />
                    No Fraud
                  </Button>
                  <Button variant="outline" className="text-orange-500 border-orange-500 rounded-full">
                    <span className="mr-1.5 h-2 w-2 rounded-full bg-orange-500" />
                    Low Fraud
                  </Button>
                  <Button variant="outline" className="text-red-500 border-red-500 rounded-full">
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
                      {/* <div className="aspect-video w-80 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300" /> */}
                      <div className="px-4 mb-6">
                        <Card className="bg-zinc-900 text-white">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-6">
                              <img src="/visa.webp" alt="Visa" className="h-8" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-400">Bank of Hacklytics</p>
                              <p className="font-mono">4512 •••• •••• 1773</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      <div>
                        <div className="mb-4 text-right">
                          <span className="text-sm text-muted-foreground">Card Status: </span>
                          <span className="flex items-center justify-end gap-2 font-bold">
                            {customer ? (
                              customer.is_locked.toLowerCase() === "true" ? (
                                <>
                                  <LockIcon className="w-4 h-4 text-red-500" />
                                  Locked
                                </>
                              ) : (
                                <>
                                  <UnlockIcon className="w-4 h-4 text-green-500" />
                                  Unlocked
                                </>
                              )
                            ) : (
                              "Loading..."
                            )}
                          </span>
                        </div>

                        <div className="mb-2 text-lg font-medium">Recent transactions</div>
                        {recentTransaction ? (
                          <div className="flex items-center justify-between">
                            <div>
                              <div>{recentTransaction.merchant}</div>
                              <div className="text-sm text-muted-foreground">
                                {recentTransaction.category}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-red-500">
                                -${recentTransaction.amt.toFixed(2)}
                              </div>
                              <div className="text-sm">
                                Risk:{" "}
                                {(() => {
                                  const score = parseFloat(recentTransaction.is_fraud);
                                  return getFraudRisk(score);
                                })()}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p>Loading transaction...</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Voice Verification</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AudioRecorder />
                  </CardContent>
                </Card>
              </div>

              {/* Live Transcript */}
              <aside className="w-full p-6 border-l">
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">Live Transcript</h2>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="w-48 h-4 rounded bg-muted" />
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
