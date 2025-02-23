"use client"

import Image from "next/image"

export default function FraudAlert() {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#D13434] text-white px-4">
        <div className="w-full max-w-sm space-y-8 text-center">
          <Image
            src="/warning.png" // Ensure your logo file is in the /public folder
            alt="Banklytics Logo"
            width={40}
            height={40}
            className="object-contain align-center mx-auto w-32 h-32 flex items-center justify-center mb-4"
          />
          <h1 className="text-4xl font-bold tracking-wide">FRAUD DETECTED</h1>
  
          <div className="space-y-2 pt-16">
            <h2 className="text-2xl font-semibold">ACCOUNT LOCKED</h2>
            <p className="text-lg">
              we have blocked your card,
              <br />
              you should expect your new card in 
              <br />
              <span className="font-semibold">5-10 business days</span>.
            </p>
          </div>
  
          <button className="px-8 py-3 bg-[#B22D2D] hover:bg-[#9E2828] transition-colors text-white font-semibold rounded-sm">
            CONTINUE
          </button>
        </div>
      </div>
    )
  }
  
  