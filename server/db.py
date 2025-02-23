import os
import uuid
import csv
import asyncio
from datetime import datetime
from supabase import create_async_client, AsyncClient
from dotenv import load_dotenv

load_dotenv(override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")


async def insert_trans(
    cc_num: str,
    merchant: str,
    category: str,
    amt: float,
    merch_lat: float,
    merch_long: float,
    is_fraud: str,
) -> dict:
    """
    Insert a transaction into the database.

    Parameters:
        cc_num (str): Credit card number (linked to customer)
        merchant (str): Merchant name
        category (str): Transaction category
        amt (float): Transaction amount
        merch_lat (float): Merchant latitude
        merch_long (float): Merchant longitude
        is_fraud (str): Fraud status

    Returns:
        dict: Success or error message.
    """
    try:
        supabase: AsyncClient = await create_async_client(SUPABASE_URL, SUPABASE_KEY)
        print("Checking for customer with cc_num:", cc_num)

        customer_query = (
            await supabase.table("customer")
            .select("*")
            .eq("cc", cc_num)
            .maybe_single()
            .execute()
        )

        print("Customer query response:", customer_query)
        customer = customer_query.data

        if not customer:
            error_message = f"Customer with cc_num {cc_num} not found"
            print(error_message)
            return {"error": error_message}

        user_id = customer["id"]
        print("Customer found, user_id:", user_id)

        trans_num = str(uuid.uuid4())
        trans_time = datetime.now().isoformat()
        new_transaction = {
            "trans_num": trans_num,
            "trans_date": trans_time.split("T")[0],  # YYYY-MM-DD
            "trans_time": trans_time,  # Full timestamp
            "merchant": merchant,
            "category": category,
            "amt": amt,
            "merch_lat": merch_lat,
            "merch_long": merch_long,
            "is_fraud": is_fraud,
            "cc_num": cc_num,
            "user_id": user_id,
        }
        print("Inserting new transaction:", new_transaction)

        insert_response = (
            await supabase.table("transaction").insert(new_transaction).execute()
        )

        if not insert_response.data:
            return {
                "error": "No data returned from insert. Possibly an error occurred."
            }

        print("Insert response:", insert_response)

        success_message = f"Transaction inserted successfully: {new_transaction}"
        print(success_message)
        return insert_response.data

    except Exception as e:
        error_message = f"Exception in insert_trans: {e}"
        print(error_message)
        return {"error": error_message}


async def update_trans(trans_num: str, updated_fields: dict) -> dict:
    """
    Update one or more fields in a transaction row by matching on `trans_num`.

    Args:
        trans_num (str): The unique transaction number to match.
        updated_fields (dict): The columns and values to update.
            Example: {"merchant": "MyMerchant", "category": "groceries"}

    Returns:
        dict: A dict describing the outcome, e.g.:
            {
                "success": "Updated 1 row(s).",
                "data": [ { ...updated row... } ]
            }
            or
            {
                "error": "No rows updated for transaction number: ..."
            }
    """
    try:
        supabase: AsyncClient = await create_async_client(SUPABASE_URL, SUPABASE_KEY)
        response = (
            await supabase.table("transaction")
            .update(updated_fields)
            .eq("trans_num", trans_num)
            .execute()
        )

        # updated_rows = response.get("data", [])
        updated_rows = response.data or []

        if not updated_rows:
            return {"error": f"No rows updated for transaction number: {trans_num}"}

        return updated_rows

    except Exception as e:
        return {"error": f"Exception while updating transaction {trans_num}: {e}"}


async def get_cust(cc_num: str):
    """
    Retrieves customer details from the Supabase database.

    Parameters:
        cc_num (str): The credit card number of the customer.

    Returns:
        dict: Customer details or an error message if not found.
    """
    try:
        supabase: AsyncClient = await create_async_client(SUPABASE_URL, SUPABASE_KEY)
        # Query the customer table to get customer details
        # customer_query = supabase.table("customer").select("*").eq("cc", cc_num).maybe_single().execute()
        customer_query = (
            await supabase.table("customer")
            .select("*")
            .eq("cc", cc_num)
            .maybe_single()
            .execute()
        )

        customer = customer_query.data

        if not customer:
            print(f"Customer with CC {cc_num} not found.")
            return {"error": "Customer not found", "cc_num": cc_num}

        print(f"Customer found: {customer}")
        return customer

    except Exception as e:
        print(f"Unexpected error while retrieving customer: {e}")
        return {"error": "Internal server error", "details": str(e)}


async def set_locked(cc: str, is_locked: str):
    """
    Set the locked status for a customer in the database.

    Parameters:
        cc (str): The credit card number of the customer.
        is_locked (str): The desired locked status ("no", "yes", "pending high", or "pending low").

    Returns:
        dict: Outcome of the update operation, e.g.,
            {
                "success": "Updated locked status for customer with cc 1234.",
                "data": [ { ...updated customer row... } ]
            }
            or
            {
                "error": "No customer found with cc 1234 to update."
            }
    """
    valid_states = {"no", "yes", "pending high", "pending low"}
    print("BALLS ")
    if is_locked not in valid_states:
        error_message = (
            f"Invalid state for is_locked: {is_locked}. Must be one of {valid_states}"
        )
        print(error_message)
        return {"error": error_message}

    try:
        supabase: AsyncClient = await create_async_client(SUPABASE_URL, SUPABASE_KEY)
        response = (
            await supabase.table("customer")
            .update({"is_locked": is_locked})
            .eq("cc", cc)
            .execute()
        )
        updated_rows = response.data or []

        if not updated_rows:
            error_message = f"No customer found with cc {cc} to update."
            print(error_message)
            return {"error": error_message}

        success_message = f"Updated locked status for customer with cc {cc}."
        print(success_message)
        return {"success": success_message, "data": updated_rows}

    except Exception as e:
        error_message = f"Exception while setting locked status for cc {cc}: {e}"
        print(error_message)
        return {"error": error_message}


async def reset_db() -> dict:
    """
    Reset the database by clearing the 'transactions' table
    and bulk-loading data from base.csv.

    Returns:
        dict: Outcome message describing success or any errors.
    """
    try:
        supabase: AsyncClient = await create_async_client(SUPABASE_URL, SUPABASE_KEY)

        # Clear the transactions table (delete all rows)
        print("Clearing transactions table...")
        del_response = (
            await supabase.table("transaction").delete().neq("trans_num", "").execute()
        )
        if hasattr(del_response, "error") and del_response.error:
            error_message = f"Error deleting transactions: {del_response.error}"
            print(error_message)
            return {"error": error_message}
        print("Transactions table cleared:", del_response.data)

        # Load data from base.csv
        print("Loading data from base.csv...")
        with open("./sample_data/base.csv", mode="r", newline="") as csvfile:
            reader = csv.DictReader(csvfile)
            # Print CSV schema (the header field names)
            print("CSV schema (field names):", reader.fieldnames)
            # Convert CSV rows to a list of dictionaries, filtering for specified rows

            # Filter for only the columns we want from the CSV
            filtered_data = []
            for row in reader:
                filtered_row = {
                    "merchant": row["merchant"],
                    "category": row["category"],
                    "trans_num": row["trans_num"],
                    "trans_date": datetime.strptime(
                        row["trans_date_trans_time"].split()[0], "%Y-%m-%d"
                    )
                    .date()
                    .isoformat(),
                    "trans_time": datetime.strptime(
                        row["trans_date_trans_time"], "%Y-%m-%d %H:%M:%S"
                    ).isoformat(),
                    "amt": float(row["amt"]),
                    "merch_lat": float(row["merch_lat"]),
                    "merch_long": float(row["merch_long"]),
                    "is_fraud": int(row["is_fraud"]),
                    "cc_num": row["cc_num"],
                }
                filtered_data.append(filtered_row)
            base_data = filtered_data

        if not base_data:
            message = "No data found in base.csv."
            print(message)
            return {"error": message}

        # Insert CSV data into transactions table
        print("Inserting data into transactions table...")
        insert_response = (
            await supabase.table("transaction").insert(base_data).execute()
        )
        if hasattr(insert_response, "error") and insert_response.error:
            error_message = f"Error inserting base.csv data: {insert_response.error}"
            print(error_message)
            return {"error": error_message}

        success_message = "Database reset successfully; base.csv data loaded."
        print(success_message)
        return {"success": success_message, "data": insert_response.data}

    except Exception as e:
        error_message = f"Exception in reset_database: {e}"
        print(error_message)
        return {"error": error_message}
