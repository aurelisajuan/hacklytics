"use client"

import { Check } from "lucide-react"

export default function TransactionApproved() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A4D2C] text-white px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="mx-auto w-32 h-32 bg-white rounded-full flex items-center justify-center">
          <Check className="w-16 h-16 text-[#0A4D2C]" strokeWidth={3} />
        </div>

        <h1 className="text-3xl font-bold tracking-wide">
          TRANSACTION
          <br />
          APPROVED!
        </h1>
      </div>
    </div>
  )
}

