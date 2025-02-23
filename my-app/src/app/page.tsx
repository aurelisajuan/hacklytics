"use client";
import { useState } from "react";
import FraudAlert from "@/components/alert";
import Profile from "@/components/profile";

const Home = () => {
  const [mode, setMode] = useState<0 | 1 | 2>(2 as 0 | 1 | 2);
  return <Profile />;
};

export default Home;