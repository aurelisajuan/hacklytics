"use client";

import { useState } from "react";
import { Camera, Home, Wallet, User, Menu } from "lucide-react";
import { motion } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PhotoUpload() {
    const [image, setImage] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
        setImage(URL.createObjectURL(e.target.files[0]));
        }
    };

    return (
        <div className="max-h-screen bg-gray-100 flex items-center justify-center p-4">
        {/* Phone container */}
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative w-[390px] h-screen p-[12px] shadow-2xl"
        >
            {/* iPhone Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[160px] h-[34px]"></div>

            {/* Screen Content */}
            <div className="relative w-full h-full bg-white rounded-[38px] overflow-hidden">
            {/* Status Bar */}
            <div className="h-14 w-full bg-white"></div>

            {/* App Content */}
            <div className="h-full overflow-y-auto pb-20">
                <div className="flex flex-col items-center justify-center px-4">
                <Card>
                    <CardContent className="p-8 flex flex-col items-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                        delay: 0.2,
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        }}
                    >
                        <Camera className="h-16 w-16 text-gray-500 mb-6" />
                    </motion.div>
                    <h2 className="text-2xl font-bold mb-3 text-gray-900">
                        Upload Your Picture
                    </h2>
                    <p className="text-center text-sm text-gray-600 mb-6">
                        Take a picture or select one from your gallery to get started.
                    </p>
                    {image ? (
                        <motion.img
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        src={image}
                        alt="Preview"
                        className="mb-6 rounded-2xl max-h-64 object-cover w-full shadow-md"
                        />
                    ) : (
                        <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-6 w-full h-64 bg-gradient-to-br from-gray-50 to-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300"
                        >
                        <span className="text-gray-400">No image selected</span>
                        </motion.div>
                    )}
                    <label htmlFor="file-upload" className="w-full">
                        <Button
                        variant="default"
                        size="lg"
                        className="w-full flex items-center justify-center py-6 bg-gray-600 hover:bg-gray-700 transition-colors duration-300"
                        >
                        <Camera className="h-5 w-5 mr-2" />
                        <span className="font-medium">Take or Upload Picture</span>
                        </Button>
                    </label>
                    <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageChange}
                        className="hidden"
                    />
                    </CardContent>
                </Card>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="absolute bottom-0 left-0 right-0 bg-white">
                <div className="flex justify-between items-center p-4">
                <Button variant="ghost" size="icon" className="flex flex-col items-center">
                    <Home className="h-5 w-5" />
                    <span className="text-xs mt-1">Home</span>
                </Button>
                <Button variant="ghost" size="icon" className="flex flex-col items-center">
                    <Wallet className="h-5 w-5" />
                    <span className="text-xs mt-1">Wallet</span>
                </Button>
                <Button variant="ghost" size="icon" className="flex flex-col items-center text-primary">
                    <User className="h-5 w-5" />
                    <span className="text-xs mt-1">Profile</span>
                </Button>
                <Button variant="ghost" size="icon" className="flex flex-col items-center">
                    <Menu className="h-5 w-5" />
                    <span className="text-xs mt-1">More</span>
                </Button>
                </div>
            </div>
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-[8px] left-1/2 transform -translate-x-1/2 w-[134px] h-[5px] bg-white rounded-full"></div>
        </motion.div>
        </div>
    );
}
