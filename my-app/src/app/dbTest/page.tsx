"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://default.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "defaultSupabaseKey";
const supabase = createClient(supabaseUrl, supabaseKey);

interface Customer {
    first_name: string;
    last_name: string;
    cc: string;
    street: string;
    city: string;
    state: string;
    zip: number;
    lat: number;
    long: number;
    job: string;
    dob: string;
    gender: string;
    is_locked: string;
}

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

const RealtimeUpdates: React.FC = () => {
    const [updates, setUpdates] = useState<Transaction[]>([]);

    const fetchTransactions = async () => {
        const { data, error } = await supabase.from("transaction").select("*");
        if (error) {
            console.error("Fetch transactions error:", error);
            return;
        }
        setUpdates(data as Transaction[]);
    };

    // Delete all rows from the transaction and customer tables.
    // const clearDatabase = async () => {
    //     const { error: transError } = await supabase
    //     .from('transaction')
    //     .delete()
    //     .neq('id', 0);
    //     if (transError) {
    //     console.log("Error deleting transactions:", transError);
    //     }
    //     const { error: custError } = await supabase
    //     .from('customer')
    //     .delete()
    //     .neq('id', 0);
    //     if (custError) {
    //     console.log("Error deleting customers:", custError);
    //     }
    // };

    const customers: Customer[] = [
        {
            first_name: "Bill",
            last_name: "Zhang",
            cc: "3502088871723054",
            street: "123 San Jose Ave",
            city: "San Jose",
            state: "CA",
            zip: 95112,
            lat: 37.3382,
            long: -121.8863,
            job: "AI Engineer",
            dob: "2002-09-27",
            gender: "M",
            is_locked: "no",
        },
        {
            first_name: "Warren",
            last_name: "Yun",
            cc: "3534330126107879",
            street: "456 Boston Rd",
            city: "Boston",
            state: "MA",
            zip: 92118,
            lat: 42.3601,
            long: -71.0589,
            job: "Robotic Engineer",
            dob: "2006-03-06",
            gender: "M",
            is_locked: "no",
        },
        {
            first_name: "Lia",
            last_name: "Lin",
            cc: "6538441737335434",
            street: "789 Los Angeles St",
            city: "Los Angeles",
            state: "CA",
            zip: 90001,
            lat: 34.0522,
            long: -118.2437,
            job: "Software Engineer",
            dob: "2004-05-24",
            gender: "F",
            is_locked: "no",
        },
        {
            first_name: "Lisa",
            last_name: "Lin",
            cc: "4586810168620942",
            street: "321 Irvine Blvd",
            city: "Irvine",
            state: "CA",
            zip: 92618,
            lat: 33.6839,
            long: -117.7947,
            job: "Frontend Engineer",
            dob: "2004-05-24",
            gender: "F",
            is_locked: "no",
        },
    ];

    const transactionsData = [
        {
            cc_num: "3502088871723054",
            transactions: [
                { merchant: "fraud_Altenwerth-Kilback", category: "home", amt: 27.12, merch_lat: 38.0298, merch_long: -77.0793 },
                { merchant: "fraud_Osinski Inc", category: "personal_care", amt: 23.33, merch_lat: 39.0298, merch_long: -77.0793 },
                { merchant: "fraud_Hills-Witting", category: "shopping_net", amt: 59.46, merch_lat: 39.0298, merch_long: -77.0793 },
            ],
        },
        {
            cc_num: "3534330126107879",
            transactions: [
                { merchant: "fraud_Ernser-Feest", category: "home", amt: 69.11, merch_lat: 45.783381, merch_long: -108.264676 },
                { merchant: "fraud_Dibbert-Green", category: "entertainment", amt: 81.76, merch_lat: 45.935636, merch_long: -108.105437 },
                { merchant: "fraud_Bahringer, Bergnaum and Quitzon", category: "home", amt: 75.63, merch_lat: 45.935636, merch_long: -108.105437 },
            ],
        },
        {
            cc_num: "6538441737335434",
            transactions: [
                { merchant: "fraud_Prosacco LLC", category: "personal_care", amt: 5.71, merch_lat: 41.3851, merch_long: -80.1752 },
                { merchant: "fraud_Upton PLC", category: "entertainment", amt: 48.05, merch_lat: 41.3851, merch_long: -80.1752 },
                { merchant: "fraud_Little, Gutmann and Lynch", category: "shopping_net", amt: 28.94, merch_lat: 41.3851, merch_long: -80.1752 },
            ],
        },
        {
            cc_num: "4586810168620942",
            transactions: [
                { merchant: "fraud_Keeling-Crist", category: "misc_pos", amt: 81.78, merch_lat: 32.5486, merch_long: -80.307 },
                { merchant: "fraud_Witting, Beer and Ernser", category: "home", amt: 148.12, merch_lat: 32.5486, merch_long: -80.307 },
                { merchant: "fraud_Lynch-Wisozk", category: "home", amt: 16.88, merch_lat: 32.5486, merch_long: -80.307 },
            ],
        },
    ];

    const uploadBulkData = async () => {
        // Insert Customers First
        for (const customer of customers) {
            const { data: existingCustomer, error: customerFetchError } = await supabase
                .from("customer")
                .select("cc")
                .eq("cc", customer.cc)
                .maybeSingle();

            if (customerFetchError) {
                console.error("Error fetching customer:", customerFetchError);
                continue;
            }

            if (!existingCustomer) {
                const { error: customerInsertError } = await supabase.from("customer").insert([customer]);
                if (customerInsertError) {
                    console.error("Error inserting customer:", customerInsertError);
                    continue;
                }
            }
        }

        // Wait for Customers to be Inserted Before Transactions
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Insert Transactions
        for (const user of transactionsData) {
            // Ensure customer exists before inserting transaction
            const { data: customerExists } = await supabase
                .from("customer")
                .select("id, cc")
                .eq("cc", user.cc_num)
                .maybeSingle();

            if (!customerExists) {
                console.error(`Customer ${user.cc_num} not found! Skipping transaction.`);
                continue;
            }

            for (const transaction of user.transactions) {
                const { data: existingTransaction, error: transactionCheckError } = await supabase
                .from("transaction")
                .select("trans_num")
                .eq("cc_num", user.cc_num)
                .eq("merchant", transaction.merchant)
                .eq("amt", transaction.amt)
                .maybeSingle();

                if (transactionCheckError) {
                    console.error("Error checking transaction:", transactionCheckError);
                    continue;
                }

                if (existingTransaction) {
                    console.log(`Transaction already exists for ${transaction.merchant} with amount ${transaction.amt}, skipping...`);
                    continue; // Skip inserting the duplicate transaction
                }
                const transTime = new Date().toISOString();
                const newTransaction: Transaction = {
                    ...transaction,
                    trans_num: crypto.randomUUID(),
                    trans_date: transTime.split("T")[0],
                    trans_time: transTime,
                    is_fraud: "no",
                    cc_num: user.cc_num,
                    user_id: customerExists.id, 
                };

                const { error: transactionInsertError } = await supabase.from("transaction").insert([newTransaction]);
                if (transactionInsertError) {
                    console.error("Error inserting transaction:", transactionInsertError);
                    continue;
                }
            }
        }
        fetchTransactions();
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    useEffect(() => {
        const channel = supabase
            .channel("hacklytics")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "transaction",
                },
                (payload) => {
                    console.log("Realtime update received:", payload);
                    const newUpdate = payload.new as Transaction;
                    setUpdates((prev) => {
                        if (prev.find((update) => update.trans_num === newUpdate.trans_num)) {
                            return prev;
                        }
                        return [...prev, newUpdate];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className="grid grid-cols-1 gap-4 p-10">
            <h1>Realtime Database Updates</h1>
            <div className="flex gap-4">
                <button
                    onClick={uploadBulkData}
                    className="m-5 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                    Upload Bulk Data
                </button>
            </div>
            {updates.length === 0 ? (
                <p>No updates available yet.</p>
            ) : (
                updates.map((update) => (
                    <div key={update.trans_num} className="border p-4 mb-4">
                        <p><strong>Transaction Date:</strong> {update.trans_date}</p>
                        <p><strong>Transaction Time:</strong> {update.trans_time}</p>
                        <p><strong>Merchant:</strong> {update.merchant}</p>
                        <p><strong>Category:</strong> {update.category}</p>
                        <p><strong>Amount:</strong> {update.amt}</p>
                        <p><strong>Fraud Status:</strong> {update.is_fraud}</p>
                    </div>
                ))
            )}
        </div>
    );
};

export default RealtimeUpdates;
