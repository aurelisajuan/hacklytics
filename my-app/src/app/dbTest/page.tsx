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

    // Fetch current transactions from the database on mount.
    const fetchTransactions = async () => {
        const { data, error } = await supabase
        .from('transaction')
        .select('*');
        if (error) {
        console.log(error);
        return;
        }
        // Set the state with the fetched data.
        setUpdates(data as Transaction[]);
    };

    const insertData = async () => {
        const newCustomer: Customer = {
        first_name: 'John',
        last_name: 'Doe',
        cc: '4111 1111 1111 1111',
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip: 94105,
        lat: 37.7749,
        long: -122.4194,
        job: 'Software Engineer',
        dob: '1990-01-01', 
        gender: 'M'
        };

        const { data: customerData, error: customerError } = await supabase
        .from('customer')
        .insert(newCustomer)
        .select();

        if (customerError) {
        console.log(customerError);
        return;
        }

        const userId = customerData[0].id;
        const now = new Date();

        const newTransaction: Transaction = {
        merchant: 'Example Merchant',
        category: 'Retail',
        trans_num: Math.floor(Math.random() * 1000000),
        trans_date: now.toISOString().split('T')[0], // e.g. "2025-02-22"
        trans_time: now.toISOString(), // e.g. "2025-02-22T09:26:42.123Z"
        amt: 100,
        merch_lat: 37.7749,
        merch_long: -122.4194,
        is_fraud: false,
        cc_num: newCustomer.cc,
        user_id: userId
        };

        const { data: transactionData, error: transactionError } = await supabase
        .from('transaction')
        .insert(newTransaction);

        if (transactionError) {
        console.log(transactionError);
        return;
        }

        console.log(
        'Customer and Transaction inserted successfully:',
        { customerData, transactionData }
        );

        setUpdates((prev) => [...prev, newTransaction]);
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
        <div className="flex flex-col items-center p-10">
        <h1>Realtime Database Updates</h1>
        <button
            onClick={insertData}
            className="m-5 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
            Insert Data
        </button>
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
