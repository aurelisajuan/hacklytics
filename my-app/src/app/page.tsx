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
  "yes": 2,
  "pending low": 0,
  "pending high": 1
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
  console.log(customer)


  if (!customer) return null;

  if (customer.is_locked === 'no') {
    return <Profile customer={customer} transactions={transactions} />;
  } else {
    return <FraudAlert mode={page_map[customer.is_locked]} />;
  }


};

export default Home;