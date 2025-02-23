import numpy as np
import pandas as pd
from datetime import datetime
from math import radians, cos, sin, asin, sqrt
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Masking
from tensorflow.keras.preprocessing.sequence import pad_sequences
import pickle

# # Function to calculate haversine distance between two lat-long points
# def haversine(lat1, lon1, lat2, lon2):
#     # Convert decimal degrees to radians 
#     lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
#     dlon = lon2 - lon1 
#     dlat = lat2 - lat1 
#     a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
#     c = 2 * asin(sqrt(a)) 
#     r = 6371  # Radius of earth in kilometers.
#     return c * r

# Load dataset
df = pd.read_csv('fraudTrain.csv')

# Convert transaction time to datetime and sort the data
# df['trans_date_trans_time'] = pd.to_datetime(df['trans_date_trans_time'])
df.sort_values(['cc_num', 'trans_date_trans_time'], inplace=True)

# Compute the distance feature
# df['distance'] = df.apply(lambda row: haversine(row['lat'], row['long'], row['merch_lat'], row['merch_long']), axis=1)

# Compute time difference between transactions for each user
# df['time_diff'] = df.groupby('cc_num')['trans_date_trans_time'].diff().dt.total_seconds().fillna(0)

# Select features and label for simplicity
features = ['amt']
# 'is_fraud' is assumed to be 0 or 1 indicating non-fraudulent or fraudulent transactions respectively.

# Optionally, you can scale features here if you plan on using them directly
scaler = StandardScaler()
df[features] = scaler.fit_transform(df[features])
with open('scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)

# Build sequences: group transactions by user
user_sequences = []
user_labels = []
for user, group in df.groupby('cc_num'):
    seq = group[features].values
    # For instance, use the last transaction's label as the label for the sequence
    label = group['is_fraud'].values[-1]
    user_sequences.append(seq)
    user_labels.append(label)

# Determine maximum sequence length and pad sequences so they are uniform in length
max_seq_len = max(len(seq) for seq in user_sequences)
X_seq = pad_sequences(user_sequences, maxlen=max_seq_len, dtype='float32', padding='pre')
y_seq = np.array(user_labels)

# Split into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X_seq, y_seq, test_size=0.2, random_state=42)

# Build the RNN model
model = Sequential()
model.add(Masking(mask_value=0., input_shape=(max_seq_len, len(features))))
model.add(LSTM(64))
model.add(Dense(1, activation='sigmoid'))

model.compile(loss='binary_crossentropy', optimizer='adam', metrics=['accuracy'])

# Train the model
model.fit(X_train, y_train, epochs=10, batch_size=32, validation_split=0.2)
model.save('fraud_detection_model.h5')

# Define a function to predict fraud for a new transaction given a user's transaction history
def predict_fraud(user_transactions, new_transaction):
    """
    user_transactions: List of past transactions (each as a list of features: [amt, distance, time_diff])
    new_transaction: A single transaction represented as [amt, distance, time_diff]
    """
    # Create updated sequence by appending the new transaction
    seq = np.array(user_transactions + [new_transaction])
    # Scale the sequence using the same scaler (if not already scaled)
    seq = scaler.transform(seq)
    # Pad the sequence to max_seq_len
    seq = pad_sequences([seq], maxlen=max_seq_len, dtype='float32', padding='pre')
    # Predict fraud probability
    prob = model.predict(seq)
    return prob[0][0]

# Example usage:
# past_transactions = [[scaled_amt1, scaled_distance1, scaled_time_diff1], ...]
# new_transaction = [raw_amt, raw_distance, raw_time_diff] then scaled using 'scaler'
# fraud_prob = predict_fraud(past_transactions, new_transaction)
