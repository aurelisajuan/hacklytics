"use client";
import { useState, useEffect } from "react";
import FraudAlert from "@/components/alert";
import Profile from "@/components/profile";
import { createClient } from "@supabase/supabase-js";

// Define the Customer interface
interface Customer {
  id?: string;
  first_name: string;
  last_name: string;
  cc: string;
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

const Home = () => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [mode, setMode] = useState<0 | 1 | 2>(2 as 0 | 1 | 2);

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

  // Fetch transactions for Lisa Lin using her credit card (cc) number
  useEffect(() => {
    async function fetchTransactions() {
      if (!customer) return;
      const { data, error } = await supabase
        .from("transaction")
        .select("*")
        .eq("cc_num", customer.cc)
        .order("trans_date", { ascending: false });
      if (error) {
        console.error("Error fetching transactions:", error);
        return;
      }
      setTransactions(data || []);
    }
    fetchTransactions();
  }, [customer]);

  return <Profile customer={customer} transactions={transactions} />;
};

export default Home;