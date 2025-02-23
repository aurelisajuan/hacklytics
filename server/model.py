import numpy as np
import pandas as pd
import io
import pickle
import warnings
import logging
from math import radians, cos, sin, asin, sqrt
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
import random

# Silence warnings
warnings.filterwarnings("ignore")
logging.getLogger("tensorflow").setLevel(logging.ERROR)
logging.getLogger("absl").setLevel(logging.ERROR)


base_file = "./experiments/sample_data/base.csv"


def predict_fraud_for_new_transaction(
    user_transactions, new_transaction, scaler, max_seq_len, model
):
    """
    Predict fraud for a new transaction using the user's historical transactions.

    Parameters:
      - user_transactions: List of past transactions (each as a list of features).
      - new_transaction: The new transaction's feature list: [amt, distance, time_diff].
      - scaler: The pre-fitted scaler.
      - max_seq_len: Maximum sequence length for padding.
      - model: The trained NN model.

    Returns:
      - fraud_prob: Predicted fraud probability.
    """
    seq = user_transactions + [new_transaction]
    seq = np.array(seq)
    seq = scaler.transform(seq)
    seq_padded = pad_sequences(
        [seq], maxlen=max_seq_len, dtype="float32", padding="pre"
    )
    fraud_prob = model.predict(seq_padded, verbose=0)
    return fraud_prob[0][0]


"""
Returns a simulated transaction and the associated fradulent risk score.

Parameters:
  - transaction_type: "regular | low_fraud | high_fraud"

Returns:
  - tx: The simulated transaction.
  - fraud_prob: Predicted fraud probability for the new transaction.
"""


def simulate_transaction(transaction_type: str):
    first = "Lisa"
    last = "Juan"
    # ------------------------------
    # Build History from base_file
    # ------------------------------
    base_df = pd.read_csv(base_file)
    # Filter the base file for the given user
    base_history_df = base_df[(base_df["first"] == first) & (base_df["last"] == last)]
    base_history_df = base_history_df.sort_values("unix_time")

    history = []
    prev_time = None
    for idx, row in base_history_df.iterrows():
        amt = float(row["amt"])
        if prev_time is None:
            time_diff = 0
        else:
            time_diff = float(row["unix_time"]) - prev_time
        prev_time = float(row["unix_time"])
        history.append([amt])

    # ------------------------------
    # Read New Transaction from separate_file
    # ------------------------------
    if transaction_type == "regular":
        separate_df = pd.read_csv("./experiments/sample_data/no_fraud.csv")
    elif transaction_type == "low_fraud":
        separate_df = pd.read_csv("./experiments/sample_data/low_fraud.csv")
    elif transaction_type == "high_fraud":
        separate_df = pd.read_csv("./experiments/sample_data/high_fraud.csv")

    # Optionally, filter the separate file as well by user if it contains multiple users
    separate_user_df = separate_df[
        (separate_df["first"] == first) & (separate_df["last"] == last)
    ]
    separate_user_df = separate_user_df.reset_index(drop=True)

    tx_index = random.randint(0, 4)

    if tx_index < 0 or tx_index >= len(separate_user_df):
        raise IndexError(
            "Transaction index out of range in the separate file for this user."
        )

    # Select the new transaction row from the separate file
    tx = separate_user_df.iloc[tx_index]
    new_amt = float(tx["amt"])

    # Compute time difference for the new transaction relative to the last history transaction (if any)
    new_time_diff = 0

    new_transaction = [new_amt]

    # ------------------------------
    # Make the Prediction
    # ------------------------------

    scaler = pickle.load(open("scaler.pkl", "rb"))
    max_seq_len = 10
    model = load_model("fraud_detection_model.h5")

    fraud_prob = predict_fraud_for_new_transaction(
        history, new_transaction, scaler, max_seq_len, model
    )
    print(
        f"Prediction for {first} {last} on transaction index {tx_index}: Fraud Probability = {fraud_prob:.4f}"
    )
    return tx, fraud_prob


details, risk_score = simulate_transaction("regular")

print(details)
print(risk_score)
