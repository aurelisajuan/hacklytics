"use client";
import { useState, useEffect } from "react";
import FraudAlert from "@/components/alert";
import TransactionApproved from "@/components/approved";
import Profile from "@/components/profile";
import { createClient } from "@supabase/supabase-js";

// Define the Customer interface
interface Customer {
  id?: string;
  first_name: string;
  last_name: string;
  cc: string;
  is_locked: "no" | "yes" | "pending low" | "pending high";
  // other fields omitted for brevity
}

// Define the Transaction interface (adapted to your database schema)
interface Transaction {
  merchant: string;
  category: string;
  trans_num: string;
  trans_date: string;
  trans_time: string;
  amt: number;
  merch_lat: number;
  merch_long: number;
  is_fraud: string;
  cc_num: string;
  user_id: string;
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

type LockStatus = "yes" | "pending low" | "pending high";
type PageMode = 0 | 1 | 2;

const page_map: Record<LockStatus, PageMode> = {
  yes: 2,
  "pending low": 0,
  "pending high": 1,
};

const Home = () => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Fetch Lisa Lin's customer record
  useEffect(() => {
    async function fetchCustomer() {
      const { data, error } = await supabase
        .from("customer")
        .select("*")
        .eq("first_name", "Lisa")
        .eq("last_name", "Lin")
        .single();
      if (error) {
        console.error("Error fetching customer:", error);
        return;
      }
      setCustomer(data);
    }
    fetchCustomer();
  }, []);

  useEffect(() => {
    if (!customer) return;

    // Create a channel for realtime customer updates
    const customerChannel = supabase
      .channel("customer-channel")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "customer",
          filter: `id=eq.${customer.id}`,
        },
        (payload) => {
          console.log("Customer update received:", payload.new);
          setCustomer(payload.new);
        }
      )
      .subscribe();

    // Clean up the subscription on unmount or customer change
    return () => {
      supabase.removeChannel(customerChannel);
    };
  }, [customer]);

  // Fetch transactions for Lisa Lin using her credit card (cc) number
  useEffect(() => {
    if (!customer) return;

    // Create a channel for realtime updates
    const channel = supabase
      .channel("transactions-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transaction",
          filter: `cc_num=eq.${customer.cc}`,
        },
        (payload) => {
          console.log("New transaction received:", payload.new);
          setTransactions((prevTransactions) => [
            payload.new,
            ...prevTransactions,
          ]);
        }
      )
      .subscribe();

    // Cleanup the subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [customer]);

  console.log(customer);

  if (!customer) return null;

  if (customer.is_locked === "no") {
    return <Profile customer={customer} transactions={transactions} />;
  } else {
    return <FraudAlert mode={page_map[customer.is_locked]} />;
  }
};

export default Home;
