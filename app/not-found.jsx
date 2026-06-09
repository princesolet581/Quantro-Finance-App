'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const NotFound = () => {
  return (
    <div className="relative min-h-screen w-full bg-gradient-to-tr from-[#0F172A] via-[#111827] to-[#1E293B] overflow-hidden flex items-center justify-center px-6 py-12">

      {/* Decorative Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] bg-pink-500 rounded-full blur-3xl opacity-30 animate-glow-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] bg-purple-600 rounded-full blur-2xl opacity-30 animate-glow-pulse" />
      <div className="absolute top-[20%] right-[20%] w-[200px] h-[200px] bg-blue-500 rounded-full blur-2xl opacity-20 animate-drift" />

      {/* Stars */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.06)_1px,_transparent_1px)] bg-[length:20px_20px] z-0" />

      {/* Main Card */}
      <div className="relative z-10 max-w-2xl w-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(255,255,255,0.05)] p-12 text-center animate-fade-in">

        {/* Glowing Title */}
        <h1 className="text-8xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(236,72,153,0.6)]">
          404
        </h1>

        <h2 className="mt-4 text-3xl font-semibold text-white tracking-wide animate-fade-in">
          This Page is Lost in Space
        </h2>

        <p className="mt-2 text-gray-400 text-sm animate-fade-in">
          Looks like you’ve ventured into uncharted territory. This page doesn’t exist... yet.
        </p>

        {/* Return Button */}
        <Link
          href="/"
          className="inline-flex items-center justify-center mt-8 px-6 py-3 bg-gradient-to-r from-fuchsia-500 via-pink-500 to-red-500 text-white font-bold text-sm rounded-full shadow-lg hover:scale-105 transition-transform duration-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Home
        </Link>
      </div>
    </div>
  )
}

export default NotFound
