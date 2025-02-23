"use client";

import { User2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Profile() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src="/avatar-placeholder.png"
                  alt="Profile picture"
                />
                <AvatarFallback>
                  <User2 className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <h2 className="text-xl font-semibold">John Doe</h2>
                <p className="text-gray-500">john.doe@example.com</p>
                <p className="text-sm text-gray-400">
                  Member since January 2024
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4">
              <div className="space-y-2">
                <h3 className="font-medium">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p>+1 (555) 123-4567</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p>New York, USA</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Account Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Account Type</p>
                    <p>Premium</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Account Status</p>
                    <p className="text-green-600">Active</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
