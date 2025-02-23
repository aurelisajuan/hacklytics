"use client";

import {
  Bell,
  Home,
  Send,
  Receipt,
  FileText,
  Wallet,
  User,
  Menu,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

// Define the Customer interface
interface Customer {
  id?: string;
  first_name: string;
  last_name: string;
  cc: string;
  // other fields omitted for brevity
}

// Define the Transaction interface (adapted to your database schema)
interface Transaction {
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
}

interface ProfileProps {
  customer: Customer;
  transactions: Transaction[];
}

export default function Profile({ customer, transactions }: ProfileProps) {
  return (
    <div className="max-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Set the phone container height to h-screen so it fills the viewport */}
      <div className="relative w-[390px] h-screen p-[12px] shadow-2xl">
        {/* iPhone Notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[160px] h-[34px]"></div>

        {/* Screen Content */}
        <div className="relative w-full h-full bg-white rounded-[38px] overflow-hidden">
          {/* Status Bar */}
          <div className="h-14 w-full bg-white"></div>

          {/* App Content - Single scrollable area */}
          <div className="h-full overflow-y-auto pb-20">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="sage.webp" alt="Profile" />
                  <AvatarFallback>UN</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-gray-500">Hello,</p>
                  <p className="font-medium">
                    {customer
                      ? `${customer.first_name} ${customer.last_name}`
                      : "Loading..."}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-6 grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center gap-2">
                <Button variant="outline" size="icon" className="h-12 w-12">
                  <Send className="h-5 w-5" />
                </Button>
                <span className="text-sm">Send</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Button variant="outline" size="icon" className="h-12 w-12">
                  <Receipt className="h-5 w-5" />
                </Button>
                <span className="text-sm">Request</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Button variant="outline" size="icon" className="h-12 w-12">
                  <FileText className="h-5 w-5" />
                </Button>
                <span className="text-sm">Pay Bills</span>
              </div>
            </div>

            {/* Card Section */}
            <div className="px-4 mb-6">
              <Card className="bg-zinc-900 text-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <p className="text-2xl font-semibold">$3009.94</p>
                    <img src="/visa.webp" alt="Visa" className="h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-400">Bank of Hacklytixs</p>
                    <p className="font-mono">4512 •••• •••• 1773</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <div className="px-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-medium">Recent Transactions</h2>
                <Button variant="link" className="text-orange-500 h-auto p-0">
                  See all
                </Button>
              </div>
              <div className="space-y-4">
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <div
                      key={transaction.trans_num}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <FileText className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">{transaction.merchant}</p>
                          <p className="text-sm text-gray-500">
                            {transaction.category}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          -${transaction.amt.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {transaction.trans_date}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>Loading transactions...</p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t">
            <div className="flex justify-between items-center p-4">
              <Button
                variant="ghost"
                size="icon"
                className="flex flex-col items-center"
              >
                <Home className="h-5 w-5" />
                <span className="text-xs mt-1">Home</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="flex flex-col items-center"
              >
                <Wallet className="h-5 w-5" />
                <span className="text-xs mt-1">Wallet</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="flex flex-col items-center text-primary"
              >
                <User className="h-5 w-5" />
                <span className="text-xs mt-1">Profile</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="flex flex-col items-center"
              >
                <Menu className="h-5 w-5" />
                <span className="text-xs mt-1">More</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-[8px] left-1/2 transform -translate-x-1/2 w-[134px] h-[5px] bg-white rounded-full"></div>
      </div>
    </div>
  );
}
