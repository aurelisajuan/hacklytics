import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
from sklearn.preprocessing import StandardScaler

# 1. Load the test CSV.
test_df = pd.read_csv('fraudTest.csv', index_col=0, parse_dates=['trans_date_trans_time'])

# 2. Define the target names.
target_names = [
    ('Scott', 'Martin'),
    ('Jeffrey', 'Smith'),
    ('Monica', 'Cohen'),
    ('Barbara', 'Taylor'),
    ('Jessica', 'Perez')
]

# 3. Filter the DataFrame for these names.
# Create a tuple of (first, last) for each row and check if it is in target_names.
test_df = test_df[test_df[['first', 'last']].apply(lambda x: (x['first'], x['last']) in target_names, axis=1)]
print("Filtered transactions count:", len(test_df))

# 4. Sort by transaction date and extract the transaction hour.
test_df.sort_values('trans_date_trans_time', inplace=True)
test_df['trans_hour'] = test_df['trans_date_trans_time'].dt.hour

# 5. Encode categorical features.
# For this demo, we'll use factorize. In production, load your saved encoders.
test_df['merchant_enc'], _ = pd.factorize(test_df['merchant'])
test_df['category_enc'], _ = pd.factorize(test_df['category'])

# 6. Compute the Euclidean distance between the card holder and merchant.
def compute_distance(row):
    card_holder = np.array([row['lat'], row['long']])
    merchant_loc = np.array([row['merch_lat'], row['merch_long']])
    return np.linalg.norm(card_holder - merchant_loc)

test_df['distance'] = test_df.apply(compute_distance, axis=1)

# 7. Define the features used during training.
feature_cols = ['amt', 'trans_hour', 'merchant_enc', 'category_enc', 'distance']

# 8. Group transactions by cc_num (assumed to correspond to each person) to form sequences.
test_sequences = []
test_labels = []
sequence_names = []  # To track which sequence belongs to which individual.

for cc, group in test_df.groupby('cc_num'):
    group = group.sort_values('trans_date_trans_time')
    seq = group[feature_cols].values
    test_sequences.append(seq)
    test_labels.append(group['is_fraud'].iloc[-1])
    # Assuming the name is consistent for a given cc_num.
    sequence_names.append((group['first'].iloc[0], group['last'].iloc[0]))

# 9. Pad the sequences to a uniform length.
max_seq_length = max(len(seq) for seq in test_sequences)
X_test = pad_sequences(test_sequences, maxlen=max_seq_length, dtype='float32', padding='post', truncating='post')
y_test = np.array(test_labels)

# 10. Scale numerical features.
num_samples, seq_length, num_features = X_test.shape
X_test_reshaped = X_test.reshape(-1, num_features)
scaler = StandardScaler()
# In practice, use your training scaler. Here we fit on the test data for demonstration.
X_test_scaled = scaler.fit_transform(X_test_reshaped).reshape(num_samples, seq_length, num_features)

# 11. Load the trained model.
model = tf.keras.models.load_model('fraud_model.h5')

# 12. Predict risk scores and compute accuracy.
predictions = model.predict(X_test_scaled)
predicted_labels = (predictions.flatten() >= 0.5).astype(int)
accuracy = np.mean(predicted_labels == y_test)
print("Accuracy for the target names:", accuracy)

# 13. (Optional) Print details per individual.
for i, name in enumerate(sequence_names):
    print(f"Name: {name[0]} {name[1]}, True Label: {y_test[i]}, Predicted Risk: {predictions[i][0]:.4f}, Predicted Label: {predicted_labels[i]}")
