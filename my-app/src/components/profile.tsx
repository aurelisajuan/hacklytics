"use client";

import { useState } from "react";
import {
  User,
  Shield,
  Bell,
  CreditCard,
  HelpCircle,
  LogOut,
  Camera,
  Mail,
  Phone,
  MapPin,
  Lock,
  Home,
  Wallet,
  PieChart,
  Menu,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function ProfileLanding() {
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen pb-20">
        {/* Header */}
        <div className="bg-gray-900 text-white pt-12 pb-6 px-4 rounded-b-3xl">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-semibold">My Profile</h1>
            <Button variant="ghost" size="icon" className="text-white">
              <Bell className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-white">
                <AvatarImage src="/sova.webp" alt="Profile picture" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <h2 className="text-xl font-semibold">John Doe</h2>
              <p className="text-gray-300">Premium Member</p>
              <p className="text-sm text-gray-300 mt-1">ID: 1234567890</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 py-6 space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="flex flex-col items-center h-auto py-3"
            >
              <Wallet className="h-6 w-6 mb-1" />
              <span className="text-xs">Add Money</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center h-auto py-3"
            >
              <CreditCard className="h-6 w-6 mb-1" />
              <span className="text-xs">Cards</span>
            </Button>
          </div>

          {/* Personal Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500">
              PERSONAL INFORMATION
            </h3>
            <div className="space-y-2">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">john.doe@gmail.com</p>
                </div>
              </div>

              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">+1 (555) 123-4567</p>
                </div>
              </div>

              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <MapPin className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">New York, USA</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500">SECURITY</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Lock className="h-5 w-5 text-gray-500 mr-3" />
                  <p className="font-medium">Change Password</p>
                </div>
                <Button variant="ghost" size="sm">
                  Change
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-gray-500 mr-3" />
                  <p className="font-medium">Biometric Authentication</p>
                </div>
                <Switch checked={biometrics} onCheckedChange={setBiometrics} />
              </div>
            </div>
          </div>

          {/* Help & Support */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <HelpCircle className="h-5 w-5 text-gray-500 mr-3" />
                <p className="font-medium">Help & Support</p>
              </div>
              <Button variant="ghost" size="sm">
                Contact
              </Button>
            </div>

            <Button
              variant="ghost"
              className="w-full flex items-center justify-center gap-3 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              <span>Log Out</span>
            </Button>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t">
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
    </div>
  );
}
