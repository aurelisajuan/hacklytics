"use client";

import { useState, Suspense } from "react";
import { Camera, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TransactionApproved from "@/components/approved";

function PhotoUploadContent() {
  const searchParams = useSearchParams();
  const cc_num = searchParams.get("cc_num");
  const [image, setImage] = useState<string | null>(null);
  const [showApproved, setShowApproved] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Create a new FileReader
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!image || !cc_num) return;
    setIsProcessing(true);

    try {
      // Image is already in base64 format from FileReader
      const base64data = image.split(",")[1];

      const res = await fetch(
        "https://fitting-correctly-lioness.ngrok-free.app/upload-image",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: base64data,
            cc_num: cc_num,
          }),
        }
      );

      if (res.ok) {
        setShowApproved(true);
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Identity not verified. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while processing your photo. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (showApproved) {
    return <TransactionApproved />;
  }

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
                    Take a picture or select one from your gallery to get
                    started.
                  </p>
                  {image ? (
                    <>
                      <motion.img
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        src={image}
                        alt="Preview"
                        className="mb-6 rounded-2xl max-h-64 object-cover w-full shadow-md"
                      />
                      <Button
                        onClick={handleSubmit}
                        variant="default"
                        size="lg"
                        disabled={isProcessing}
                        className="w-full mb-4 bg-green-600 hover:bg-green-700"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Submit Photo"
                        )}
                      </Button>
                    </>
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
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                    variant="default"
                    size="lg"
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center py-6 bg-gray-600 hover:bg-gray-700 transition-colors duration-300"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    <span className="font-medium">Take or Upload Picture</span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function PhotoUpload() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PhotoUploadContent />
    </Suspense>
  );
}
