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

    // Fetch all transactions from the database
    const fetchTransactions = async () => {
        const { data, error } = await supabase.from('transaction').select('*');
        if (error) {
        console.log(error);
        return;
        }
        setUpdates(data as Transaction[]);
    };

    // Bulk upload four customers and 3 transactions each.
    const uploadBulkData = async () => {
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
        { merchant: "fraud_Example1", category: "home", amt: 27.12 },
        { merchant: "fraud_Example2", category: "personal_care", amt: 23.33 },
        { merchant: "fraud_Example3", category: "shopping_net", amt: 59.46 },
        { merchant: "fraud_Example4", category: "home", amt: 9.62 },
        { merchant: "fraud_Example5", category: "shopping_pos", amt: 3.76 }
        ];

        for (const customer of customers) {
        const { data: customerData, error: customerError } = await supabase
            .from('customer')
            .insert(customer)
            .select();
        if (customerError) {
            console.log(customerError);
            continue;
        }
        const userId = customerData[0].id;
        // We'll insert 3 transactions for each customer.
        const numTransactions = 3;
        const baseTime = new Date();
        for (let i = 0; i < numTransactions; i++) {
            // Offset each transaction time by i minutes.
            const transTime = new Date(baseTime.getTime() + i * 60000);
            // Pick a random sample transaction.
            const sample =
            sampleTransactions[Math.floor(Math.random() * sampleTransactions.length)];
            const newTransaction: Transaction = {
            merchant: sample.merchant,
            category: sample.category,
            trans_num: Math.floor(Math.random() * 1000000),
            trans_date: transTime.toISOString().split('T')[0],
            trans_time: transTime.toISOString(),
            amt: sample.amt,
            merch_lat: customer.lat, 
            merch_long: customer.long,
            is_fraud: false,
            cc_num: customer.cc,
            user_id: userId
            };
            const { error: transactionError } = await supabase
            .from('transaction')
            .insert(newTransaction);
            if (transactionError) {
            console.log(transactionError);
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
