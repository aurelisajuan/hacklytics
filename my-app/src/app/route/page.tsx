"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://default.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || 'defaultSupabaseKey';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Update {
    transaction_date: string;
    cc: string;
    merchant: string;
    category: string;
    amount: number;
    first_name: string;
    last_name: string;
    long: number;
    lat: number;
    merch_long: number;
    merch_lat: number;
    trans_num: number;
    is_fraud: boolean;
}

const RealtimeUpdates: React.FC = () => {
    const [updates, setUpdates] = useState<Update[]>([]);

    const insertData = async () => {
        const newData: Update = {
        transaction_date: new Date().toISOString(),
        cc: '4111 1111 1111 1111',
        merchant: 'Example Merchant',
        category: 'Retail',
        amount: 100,
        first_name: 'John',
        last_name: 'Doe',
        long: -122.4194,
        lat: 37.7749,
        merch_long: -122.4194,
        merch_lat: 37.7749,
        trans_num: Math.floor(Math.random() * 1000000),
        is_fraud: false,
        };

        const { data, error } = await supabase.from('dataset').insert(newData);
        console.log(error)
        console.log(data)

        // if (error) {
        // console.error('Error inserting data:', error);
        // } else {
        // console.log('Data inserted successfully:', data);
        // }
    };

    useEffect(() => {
        const channel = supabase
        .channel('hacklytics')
        .on(
            'postgres_changes',
            {
            event: '*',
            schema: 'public', 
            table: 'dataset',
            },
            (payload) => {
            console.log('Realtime update received:', payload);
            const newUpdate = payload.new as Update;
            setUpdates((prev) => [...prev, newUpdate]);
            }
        )
        .subscribe();

        return () => {
        supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div>
        <h1>Realtime Database Updates</h1>
        <button onClick={insertData} style={{ marginBottom: '20px' }}>
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
                marginBottom: '10px',
                }}
            >
                <p>
                <strong>Transaction Date:</strong> {update.transaction_date}
                </p>
                <p>
                <strong>Credit Card:</strong> {update.cc}
                </p>
                <p>
                <strong>Merchant:</strong> {update.merchant}
                </p>
                <p>
                <strong>Category:</strong> {update.category}
                </p>
                <p>
                <strong>Amount:</strong> {update.amount}
                </p>
                <p>
                <strong>Name:</strong> {update.first_name} {update.last_name}
                </p>
                <p>
                <strong>Location:</strong> {update.lat}, {update.long}
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
