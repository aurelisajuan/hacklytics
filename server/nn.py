import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Masking
from tensorflow.keras.preprocessing.sequence import pad_sequences
from sklearn.preprocessing import LabelEncoder, StandardScaler

# Ensure TensorFlow 2.18.0 is being used
print("TensorFlow version:", tf.__version__)

###############################
# 1. Load and Preprocess Data #
###############################

# Load training and test CSV files
train_df = pd.read_csv('fraudTrain.csv', index_col=0, parse_dates=['trans_date_trans_time'])
test_df = pd.read_csv('fraudTest.csv', index_col=0, parse_dates=['trans_date_trans_time'])

# Sort by transaction date
train_df.sort_values('trans_date_trans_time', inplace=True)
test_df.sort_values('trans_date_trans_time', inplace=True)

# Extract transaction hour
train_df['trans_hour'] = train_df['trans_date_trans_time'].dt.hour
test_df['trans_hour'] = test_df['trans_date_trans_time'].dt.hour

# Encode categorical features: merchant and category
# Fit encoders on the training set and use them for the test set
merchant_le = LabelEncoder()
train_df['merchant_enc'] = merchant_le.fit_transform(train_df['merchant'])
test_df['merchant_enc'] = merchant_le.transform(test_df['merchant'])

category_le = LabelEncoder()
train_df['category_enc'] = category_le.fit_transform(train_df['category'])
test_df['category_enc'] = category_le.transform(test_df['category'])

# Compute Euclidean distance between card holder and merchant
def compute_distance(row):
    card_holder = np.array([row['lat'], row['long']])
    merchant_loc = np.array([row['merch_lat'], row['merch_long']])
    return np.linalg.norm(card_holder - merchant_loc)

train_df['distance'] = train_df.apply(compute_distance, axis=1)
test_df['distance'] = test_df.apply(compute_distance, axis=1)

###############################################
# 2. Group Transactions into Sequences by cc_num
###############################################

# Define the feature columns to be used in the sequence.
feature_cols = ['amt', 'trans_hour', 'merchant_enc', 'category_enc', 'distance']

def create_sequences(df, feature_cols):
    sequences = []
    labels = []
    # Group by cc_num to create transaction sequences for each card
    for cc, group in df.groupby('cc_num'):
        group = group.sort_values('trans_date_trans_time')
        seq = group[feature_cols].values
        sequences.append(seq)
        # Use the fraud label (is_fraud) of the last transaction in the sequence as the target.
        labels.append(group['is_fraud'].iloc[-1])
    return sequences, np.array(labels)

train_sequences, y_train = create_sequences(train_df, feature_cols)
test_sequences, y_test = create_sequences(test_df, feature_cols)

#############################################
# 3. Pad Sequences and Scale Numerical Data
#############################################

# Determine the maximum sequence length across both training and test sets.
max_seq_train = max(len(seq) for seq in train_sequences)
max_seq_test = max(len(seq) for seq in test_sequences)
max_seq_length = max(max_seq_train, max_seq_test)

# Pad sequences so that each has the same length.
X_train = pad_sequences(train_sequences, maxlen=max_seq_length, dtype='float32',
                         padding='post', truncating='post')
X_test = pad_sequences(test_sequences, maxlen=max_seq_length, dtype='float32',
                        padding='post', truncating='post')

# Scale numerical features: fit scaler on training data then apply to both train and test.
num_samples_train, seq_length, num_features = X_train.shape
X_train_reshaped = X_train.reshape(-1, num_features)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train_reshaped).reshape(num_samples_train, seq_length, num_features)

num_samples_test = X_test.shape[0]
X_test_reshaped = X_test.reshape(-1, num_features)
X_test_scaled = scaler.transform(X_test_reshaped).reshape(num_samples_test, seq_length, num_features)

#################################
# 4. Build and Train the RNN Model
#################################

# Build an RNN model with a Masking layer, an LSTM layer, and a final Dense layer with sigmoid activation.
model = Sequential()
model.add(Masking(mask_value=0.0, input_shape=(max_seq_length, num_features)))
model.add(LSTM(64, return_sequences=False))
model.add(Dense(1, activation='sigmoid'))  # Outputs risk factor (0-1)

model.compile(loss='binary_crossentropy', optimizer='adam', metrics=['accuracy'])
model.summary()

# Train the model using the training data.
model.fit(X_train_scaled, y_train, epochs=10, batch_size=32, validation_split=0.1)

# Evaluate the model on the test data.
loss, accuracy = model.evaluate(X_test_scaled, y_test)
print("Test accuracy:", accuracy)
