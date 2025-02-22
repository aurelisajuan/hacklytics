"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://default.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || 'defaultSupabaseKey';
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
}

interface Transaction {
    merchant: string;
    category: string;
    trans_num: number;
    trans_date: string;
    trans_time: string;
    amt: number;
    merch_lat: number;
    merch_long: number;
    is_fraud: boolean;
    cc_num: string;
    user_id: string;
}

const RealtimeUpdates: React.FC = () => {
    const [updates, setUpdates] = useState<Transaction[]>([]);

    // Fetch all transactions from the database.
    const fetchTransactions = async () => {
        const { data, error } = await supabase.from('transaction').select('*');
        if (error) {
        console.log("Fetch transactions error:", error);
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

    // Bulk upload four customers and 3-5 transactions each.
    const uploadBulkData = async () => {
        // First, clear existing data.
        // await clearDatabase();

        // Define four new customers.
        const customers: Customer[] = [
        {
            first_name: "Bill",
            last_name: "Zhang",
            cc: "4111 1111 1111 1111",
            street: "123 San Jose Ave",
            city: "San Jose",
            state: "CA",
            zip: 95112,
            lat: 37.3382,
            long: -121.8863,
            job: "AI Engineer",
            dob: "2002-09-27",
            gender: "M"
        },
        {
            first_name: "Warren",
            last_name: "Yun",
            cc: "4222 2222 2222 2222",
            street: "456 Boston Rd",
            city: "Boston",
            state: "MA",
            zip: 92118,
            lat: 42.3601,
            long: -71.0589,
            job: "Robotic Engineer",
            dob: "2006-03-06",
            gender: "M"
        },
        {
            first_name: "Lia",
            last_name: "Lin",
            cc: "4333 3333 3333 3333",
            street: "789 Los Angeles St",
            city: "Los Angeles",
            state: "CA",
            zip: 90001,
            lat: 34.0522,
            long: -118.2437,
            job: "Software Engineer",
            dob: "2004-05-24",
            gender: "F"
        },
        {
            first_name: "Lisa",
            last_name: "Lin",
            cc: "4444 4444 4444 4444",
            street: "321 Irvine Blvd",
            city: "Irvine",
            state: "CA",
            zip: 92618,
            lat: 33.6839,
            long: -117.7947,
            job: "Frontend Engineer",
            dob: "2004-05-24",
            gender: "F"
        }
        ];

        const sampleTransactions = [
        { merchant: "fraud_Altenwerth-Kilback", category: "home", amt: 27.12 },
        { merchant: "fraud_Osinski Inc", category: "personal_care", amt: 23.33 },
        { merchant: "fraud_Hills-Witting", category: "shopping_net", amt: 59.46 },
        { merchant: "fraud_Gutmann, McLaughlin and Wiza", category: "home", amt: 9.62 },
        { merchant: "fraud_Roob, Conn and Tremblay", category: "shopping_pos", amt: 3.76 },
        { merchant: "fraud_Kling, Howe and Schneider", category: "home", amt: 4.85 },
        { merchant: "fraud_Ebert-Daugherty", category: "travel", amt: 8.34 },
        { merchant: "fraud_Leannon-Ward", category: "food_dining", amt: 35.78 },
        { merchant: "fraud_Abbott-Steuber", category: "personal_care", amt: 16.57 },
        { merchant: "fraud_Stark-Batz", category: "entertainment", amt: 14.62 },
        { merchant: "fraud_McCullough Group", category: "entertainment", amt: 20.50 },
        { merchant: "fraud_Hagenes LLC", category: "shopping_net", amt: 45.00 },
        { merchant: "fraud_Bashirian PLC", category: "personal_care", amt: 12.99 },
        { merchant: "fraud_Roberts-Jakubowski", category: "home", amt: 18.75 }
        ];

        for (const customer of customers) {
        // Insert customer using upsert based on the "cc" field.
        const { data: customerData, error: customerError } = await supabase
            .from('customer')
            .upsert(customer, { onConflict: 'cc' })
            .select();
        if (customerError) {
            console.log("Upsert customer error:", customerError);
            continue;
        }
        const userId = customerData[0].id;
        const numTransactions = Math.floor(Math.random() * 3) + 3;
        const baseTime = new Date();
        for (let i = 0; i < numTransactions; i++) {
            // Offset each transaction time by i minutes.
            const transTime = new Date(baseTime.getTime() + i * 60000);
            // Pick a random sample transaction.
            const sample = sampleTransactions[Math.floor(Math.random() * sampleTransactions.length)];
            // Add a small random offset to customer's location for merchant location.
            const offsetLat = (Math.random() - 0.5) * 0.1;
            const offsetLong = (Math.random() - 0.5) * 0.1;
            const newTransaction: Transaction = {
            merchant: sample.merchant,
            category: sample.category,
            trans_num: Math.floor(Math.random() * 1000000),
            trans_date: transTime.toISOString().split('T')[0],
            trans_time: transTime.toISOString(),
            amt: sample.amt,
            merch_lat: customer.lat + offsetLat,
            merch_long: customer.long + offsetLong,
            is_fraud: false,
            cc_num: customer.cc,
            user_id: userId
            };
            const { error: transactionError } = await supabase
            .from('transaction')
            .insert(newTransaction);
            if (transactionError) {
            console.log("Transaction insert error:", transactionError);
            continue;
            }
            console.log('Inserted transaction for', customer.first_name, newTransaction);
        }
        }
        fetchTransactions();
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    // Subscribe to real-time updates for the transaction table.
    useEffect(() => {
        const channel = supabase
        .channel('hacklytics')
        .on(
            'postgres_changes',
            {
            event: '*',
            schema: 'public',
            table: 'transaction'
            },
            (payload) => {
            console.log('Realtime update received:', payload);
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
            <div
                key={update.trans_num}
                style={{
                border: '1px solid #ccc',
                padding: '10px',
                marginBottom: '10px'
                }}
            >
                <p>
                <strong>Transaction Date:</strong> {update.trans_date}
                </p>
                <p>
                <strong>Transaction Time:</strong> {update.trans_time}
                </p>
                <p>
                <strong>Merchant:</strong> {update.merchant}
                </p>
                <p>
                <strong>Category:</strong> {update.category}
                </p>
                <p>
                <strong>Amount:</strong> {update.amt}
                </p>
                <p>
                <strong>Credit Card:</strong> {update.cc_num}
                </p>
                <p>
                <strong>User ID:</strong> {update.user_id}
                </p>
                <p>
                <strong>Merchant Location:</strong> {update.merch_lat}, {update.merch_long}
                </p>
                <p>
                <strong>Transaction Number:</strong> {update.trans_num}
                </p>
                <p>
                <strong>Fraud:</strong> {update.is_fraud ? 'Yes' : 'No'}
                </p>
            </div>
            ))
        )}
        </div>
    );
};

export default RealtimeUpdates;
