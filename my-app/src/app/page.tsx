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

  // Fetch Lisa Lin's customer record and set up realtime subscriptions
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

      // Fetch initial transactions once we have the customer
      const { data: transData, error: transError } = await supabase
        .from("transaction")
        .select("*")
        .eq("cc_num", data.cc)
        .order("trans_date", { ascending: false });

      if (!transError && transData) {
        setTransactions(transData);
      }

      // Set up realtime subscriptions
      const customerChannel = supabase
        .channel('customer-channel')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'customer',
            filter: `id=eq.${data.id}`,
          },
          (payload) => {
            console.log('Customer update received:', payload.new);
            setCustomer(payload.new as Customer);
          }
        )
        .subscribe();

      const transactionChannel = supabase
        .channel('transactions-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'transaction',
            filter: `cc_num=eq.${data.cc}`,
          },
          (payload) => {
            console.log('New transaction received:', payload.new);
            setTransactions((prevTransactions) => [payload.new as Transaction, ...prevTransactions]);
          }
        )
        .subscribe();

      // Clean up subscriptions on unmount
      return () => {
        supabase.removeChannel(customerChannel);
        supabase.removeChannel(transactionChannel);
      };
    }

    fetchCustomer();
  }, []);

  console.log(customer)


  if (!customer) return null;

  if (customer.is_locked === 'no') {
    return <Profile customer={customer} transactions={transactions} />;
  } else {
    return <FraudAlert mode={page_map[customer.is_locked]} cc_num={customer.cc} />;
  }

};

export default Home;