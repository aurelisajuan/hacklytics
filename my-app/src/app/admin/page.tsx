/* eslint-disable  @typescript-eslint/no-explicit-any */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Home, Search, Settings, User2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@supabase/supabase-js";
import { Pie, Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
} from "chart.js";
import {
  GoogleMap,
  useJsApiLoader,
  HeatmapLayer,
} from "@react-google-maps/api";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement
);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

type Transaction = {
  merchant: string;
  category: string;
  trans_num: string;
  trans_date: string;
  trans_time: string;
  amt: number;
  risk_fact: number;
  merch_lat: number;
  merch_long: number;
  is_fraud: string;
  cc_num: string;
  user_id: string;
};

// Transaction Breakdown Pie Chart Component
const TransactionBreakdownChart = ({ updates }: { updates: Transaction[] }) => {
  const [segmentation] = useState("category");
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    async function fetchTransactions() {
      const selectColumns =
        segmentation === "category"
          ? "category, amt"
          : segmentation === "state"
            ? "state, amt"
            : segmentation === "city"
              ? "city, amt"
              : "category, amt";

      const { data, error } = await supabase
        .from("transaction")
        .select(selectColumns);

      if (error) {
        console.log(error);
        return;
      }

      const totals: { [key: string]: number } = {};
      data?.forEach((tx: any) => {
        const key = tx[segmentation] || "Unknown";
        totals[key] = (totals[key] || 0) + tx.amt;
      });

      const labels = Object.keys(totals);
      const amounts = Object.values(totals);
      setChartData({
        labels,
        datasets: [
          {
            data: amounts,
            backgroundColor: [
              "#FFCE56",
              "#FFDD78",
              "#FFEBA0", // Yellow shades
              "#36A2EB",
              "#5AB3F0",
              "#7DC4F5", // Blue shades
              "#4BC0C0",
              "#6FD1D1",
              "#92E2E2", // Green shades
            ],
            hoverBackgroundColor: [
              "#FFCE56",
              "#FFDD78",
              "#FFEBA0", // Yellow shades
              "#36A2EB",
              "#5AB3F0",
              "#7DC4F5", // Blue shades
              "#4BC0C0",
              "#6FD1D1",
              "#92E2E2", // Green shades
            ],
          },
        ],
      });
    }
    fetchTransactions();
  }, [segmentation, updates]);

  return (
    <div className="w-full h-5/6 flex items-center justify-center pt-2">
      {chartData ? (
        <Pie
          data={chartData}
          options={{
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "bottom", labels: { font: { size: 10 } } },
            },
          }}
        />
      ) : (
        <p>Loading chart data...</p>
      )}
    </div>
  );
};

// Geospatial Heat Map Component
const containerStyle = {
  width: "100%",
  height: "100%",
};

const center = {
  lat: 51.505,
  lng: -0.09,
};

const GoogleHeatMap = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["visualization"],
  });

  const [, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const heatmapData = [
    { lat: 51.505, lng: -0.09, weight: 1 },
    { lat: 51.51, lng: -0.1, weight: 0.5 },
    { lat: 51.51, lng: -0.12, weight: 0.8 },
    { lat: 51.52, lng: -0.11, weight: 0.6 },
    { lat: 51.53, lng: -0.1, weight: 0.3 },
  ];

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading maps</div>;

  return (
    <div className="w-full h-5/6">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        <HeatmapLayer
          data={heatmapData.map(
            (point) => new google.maps.LatLng(point.lat, point.lng)
          )}
          options={{ radius: 20, opacity: 0.6 }}
        />
      </GoogleMap>
    </div>
  );
};

// Live Risk Trend Line Chart Component
const LiveRiskTrendLineChart = () => {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    async function fetchRiskTrend() {
      const { data, error } = await supabase
        .from("transaction")
        .select("trans_date, trans_time, risk_fact");
      if (error) return console.log(error);

      const trend: { [key: string]: { total: number; count: number } } = {};
      data.forEach((tx: any) => {
        const timestamp = `${tx.trans_date}`;
        if (!trend[timestamp]) trend[timestamp] = { total: 0, count: 0 };
        trend[timestamp].total += tx.risk_fact;
        trend[timestamp].count += 1;
      });

      const labels = Object.keys(trend).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      );
      const averages = labels.map(
        (label) => trend[label].total / trend[label].count
      );

      setChartData({
        labels,
        datasets: [
          {
            label: "Average Risk Score",
            data: averages,
            borderColor: "#36A2EB",
            fill: false,
          },
        ],
      });
    }
    fetchRiskTrend();
  }, []);

  return (
    <div className="w-full h-full p-2">
      {chartData ? (
        <Line data={chartData} options={{ maintainAspectRatio: false }} />
      ) : (
        <p>Loading risk trend data...</p>
      )}
    </div>
  );
};

// Transaction Volume Bar Chart Component
const TransactionVolumeBarChart = ({ updates }: { updates: Transaction[] }) => {
  const [segmentation] = useState("category");
  const [chartData, setChartData] = useState<any>(null);
  const riskThreshold = 0.5;

  useEffect(() => {
    async function fetchVolume() {
      const { data, error } = await supabase
        .from("transaction")
        .select("category, risk_fact");
      if (error) return console.log(error);

      const volume: { [key: string]: { count: number; riskTotal: number } } =
        {};
      data.forEach((tx: any) => {
        const cat = tx.category || "Unknown";
        if (!volume[cat]) volume[cat] = { count: 0, riskTotal: 0 };
        volume[cat].count += 1;
        volume[cat].riskTotal += tx.risk_fact;
      });

      const labels = Object.keys(volume);
      const counts = labels.map((label) => volume[label].count);
      const avgRisks = labels.map(
        (label) => volume[label].riskTotal / volume[label].count
      );
      // const backgroundColors = avgRisks.map(avg => avg >= riskThreshold ? "#FF6384" : "#36A2EB");

      const backgroundColor = avgRisks.map((avg) =>
        avg >= riskThreshold ? "#FF6384" : "#36A2EB"
      );
      setChartData({
        labels,
        datasets: [
          { label: "Transaction Volume", data: counts, backgroundColor },
        ],
      });
    }
    fetchVolume();
  }, [segmentation, updates]);

  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      {chartData ? (
        <Bar data={chartData} options={{ maintainAspectRatio: false }} />
      ) : (
        <p>Loading volume data...</p>
      )}
    </div>
  );
};

// Risk Distribution Histogram Component
const RiskDistributionHistogram = ({ updates }: { updates: Transaction[] }) => {
  const [chartData, setChartData] = useState<any>(null);
  const bins = [0, 0.2, 0.4, 0.6, 0.8, 1.0];

  useEffect(() => {
    const data = updates.map((tx) => ({
      risk_fact: tx.risk_fact,
    }));

    console.log(updates);
    async function fetchRiskDistribution() {
      const { data, error } = await supabase
        .from("transaction")
        .select("risk_fact");
      if (error) return console.log(error);
      console.log(data);

      const distribution = Array(bins.length - 1).fill(0);
      data.forEach((tx: any) => {
        const score = tx.risk_fact;
        for (let i = 0; i < bins.length - 1; i++) {
          if (score >= bins[i] && score < bins[i + 1]) {
            distribution[i]++;
            break;
          }
        }
      });

      const labels = bins
        .slice(0, -1)
        .map((b, i) => `${b.toFixed(1)} - ${bins[i + 1].toFixed(1)}`);
      setChartData({
        labels,
        datasets: [
          {
            label: "Risk Distribution",
            data: distribution,
            backgroundColor: "#FFCE56",
          },
        ],
      });
    }
    fetchRiskDistribution();
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      {chartData ? (
        <Bar data={chartData} options={{ maintainAspectRatio: false }} />
      ) : (
        <p>Loading histogram data...</p>
      )}
    </div>
  );
};

// Risk Gauge Widget Component
const RiskGaugeWidget = () => {
  const [chartData, setChartData] = useState<any>(null);
  const riskThreshold = 0.5;

  useEffect(() => {
    async function fetchRiskGauge() {
      const { data, error } = await supabase
        .from("transaction")
        .select("risk_fact");
      if (error) return console.log(error);

      const total = data.length;
      const highRiskCount = data.filter(
        (tx: any) => tx.risk_fact >= riskThreshold
      ).length;
      const highRiskPercentage = total ? (highRiskCount / total) * 100 : 0;

      setChartData({
        labels: ["High Risk", "Low Risk"],
        datasets: [
          {
            data: [highRiskPercentage, 100 - highRiskPercentage],
            backgroundColor: ["#36A2EB", "#FFCE56"],
          },
        ],
      });
    }
    fetchRiskGauge();
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-2">
      <div className="w-60 h-60 pb-10">
        {chartData ? (
          <Doughnut data={chartData} options={{ maintainAspectRatio: false }} />
        ) : (
          <p>Loading gauge data...</p>
        )}
      </div>
    </div>
  );
};

// Sidebar Component
function Sidebar({
  activeLink,
  setActiveLink,
}: {
  activeLink: string;
  setActiveLink: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <aside className="h-full w-60 border-r border-gray-200 bg-white">
      <div className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Banklytics Logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <span className="text-2xl font-semibold">Banklytics</span>
        </div>
      </div>
      <nav className="flex h-full flex-col p-4">
        <Link
          href="/admin"
          onClick={() => setActiveLink("dashboard")}
          className={`mb-1 flex items-center gap-2 rounded-lg px-4 py-2 ${activeLink === "dashboard"
            ? "bg-[#E5F3FF] text-sky-600"
            : "text-gray-500 hover:bg-[#E5F3FF] hover:text-sky-600"
            }`}
        >
          <Home className="w-5 h-5" />
          Dashboard
        </Link>
        <Link
          href="/user"
          onClick={() => setActiveLink("user-profiles")}
          className={`mb-1 flex items-center gap-2 rounded-lg px-4 py-2 ${activeLink === "user-profiles"
            ? "bg-[#E5F3FF] text-sky-600"
            : "text-gray-500 hover:bg-[#E5F3FF] hover:text-sky-600"
            }`}
        >
          <User2 className="w-5 h-5" />
          User Profiles
        </Link>
        <Link
          href="#"
          onClick={() => setActiveLink("settings")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 ${activeLink === "settings"
            ? "bg-[#E5F3FF] text-sky-600"
            : "text-gray-500 hover:bg-[#E5F3FF] hover:text-sky-600"
            }`}
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
      </nav>
    </aside>
  );
}

export default function Dashboard() {
  const [activeLink, setActiveLink] = useState("dashboard");
  const [, setUpdates] = useState<Transaction[]>([]);

  useEffect(() => {
    async function initializeData() {
      // Fetch customer first
      const { data: customerData, error: customerError } = await supabase
        .from("customer")
        .select("*")
        .eq("first_name", "Lisa")
        .eq("last_name", "Lin")
        .single();

      if (customerError) {
        console.error("Error fetching customer:", customerError);
        return;
      }
      // Fetch initial transactions for this customer
      const { data: transData, error: transError } = await supabase
        .from("transaction")
        .select("*")
        .eq("cc_num", customerData.cc)
        .order("trans_date", { ascending: false });

      if (!transError && transData) {
        console.log(transData);
        setUpdates(transData);
      }

      // Set up realtime subscription
      const channel = supabase
        .channel("transaction-channel")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "transaction" },
          (payload) => {
            console.log("Realtime update received:", payload);
            const newUpdate = payload.new as Transaction;
            if (newUpdate.cc_num === customerData.cc) {
              console.log(newUpdate);
              setUpdates([...updates, newUpdate]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    initializeData();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeLink={activeLink} setActiveLink={setActiveLink} />
      <div className="flex flex-1 flex-col bg-gray-50">
        <header className="flex h-16 items-center border-b border-gray-200 bg-white px-6">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-4 ml-auto">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search here ..."
                className="w-[300px] bg-white pl-8"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar>
                  <AvatarImage src="/jett.webp" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="p-3 flex-1 overflow-hidden">
          {/* 2x3 grid with fixed heights per card */}
          <div className="grid grid-cols-3 grid-rows-2 gap-2 h-[calc(100vh-4rem)] overflow-hidden">
            <Card className="rounded-lg shadow-sm">
              <CardHeader className="border-b p-3 bg-white px-6">
                <CardTitle>Transaction Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-2 h-full overflow-hidden">
                <TransactionBreakdownChart updates={updates} />
              </CardContent>
            </Card>
            <Card className="rounded-lg shadow-sm">
              <CardHeader className="border-b p-3 bg-white px-6">
                <CardTitle>Transaction Volume</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pb-10 h-full overflow-hidden">
                <TransactionVolumeBarChart updates={updates} />
              </CardContent>
            </Card>
            <Card className="rounded-lg shadow-sm">
              <CardHeader className="border-b p-3 bg-white px-6">
                <CardTitle>Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-2 pb-10 h-full overflow-hidden">
                <RiskDistributionHistogram updates={updates} />
              </CardContent>
            </Card>
            <Card className="rounded-lg shadow-sm">
              <CardHeader className="border-b p-3 bg-white px-6">
                <CardTitle>Risk Gauge</CardTitle>
              </CardHeader>
              <CardContent className="p-2 h-full overflow-hidden">
                <RiskGaugeWidget />
              </CardContent>
            </Card>
            <Card className="rounded-lg shadow-sm">
              <CardHeader className="border-b p-3 bg-white px-6">
                <CardTitle>Geospatial Heat Map</CardTitle>
              </CardHeader>
              <CardContent className="p-2 h-full overflow-hidden">
                <div className="w-full h-full">
                  <GoogleHeatMap />
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg shadow-sm">
              <CardHeader className="border-b p-3 bg-white px-6">
                <CardTitle>Live Risk Trend</CardTitle>
              </CardHeader>
              <CardContent className="p-2 pb-14 h-full overflow-hidden">
                <LiveRiskTrendLineChart />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
