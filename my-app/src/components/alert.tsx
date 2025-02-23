"use client";

import Image from "next/image";

export default function FraudAlert({ mode, cc_num }: { mode: 0 | 1 | 2, cc_num: string }) {
  // Mode is a number that is either 0, 1 or 2
  // 0: Account temporarily locked, you should receive a phone call in a couple minutes verifying your identity
  // 1: Account more seriously locked, you need to upload a selfie to verify your identity
  // 3: Account disabled, you will receive a new card in 5-10 business days
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
          {mode === 0 && (
            <>
              <h2 className="text-2xl font-semibold">
                ACCOUNT TEMPORARILY LOCKED
              </h2>
              <p className="text-lg">
                For your security, your account has been temporarily locked.
                <br />
                You will receive a phone call shortly to verify your identity.
              </p>
            </>
          )}
          {mode === 1 && (
            <>
              <h2 className="text-2xl font-semibold">ACCOUNT LOCKED</h2>
              <p className="text-lg">
                For your security, your account has been locked.
                <br />
                Please upload a selfie to verify your identity.
              </p>
            </>
          )}
          {mode === 2 && (
            <>
              <h2 className="text-2xl font-semibold">ACCOUNT DISABLED</h2>
              <p className="text-lg">
                We have blocked your card.
                <br />
                You will receive a new card in
                <br />
                <span className="font-semibold">5-10 business days</span>.
              </p>
            </>
          )}
        </div>

        {mode === 1 && (
          <button
            onClick={() => window.location.href = `/photo?cc_num=${cc_num}`}
            className="px-8 py-3 bg-[#B22D2D] hover:bg-[#9E2828] transition-colors text-white font-semibold rounded-sm"
          >
            UPLOAD SELFIE
          </button>
        )}
      </div>
    </div>
  );
}
