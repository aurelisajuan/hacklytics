import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def update_transaction(trans_num: str, updated_fields: dict) -> dict:
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
        response = supabase.table("transaction") \
                            .update(updated_fields) \
                            .eq("trans_num", trans_num) \
                            .execute()

        # updated_rows = response.get("data", [])
        updated_rows = response.data or []

        if not updated_rows:
            return {"error": f"No rows updated for transaction number: {trans_num}"}

        return {
            "success": f"Updated {len(updated_rows)} row(s).",
            "data": updated_rows
        }

    except Exception as e:
        return {"error": f"Exception while updating transaction {trans_num}: {e}"}

# result = update_transaction(
#     trans_num="cdcd57ea-196e-4891-ab5f-e1ded62d5702",
#     updated_fields={"category": "electronics", "amt": 129.99}
# )

# print("Update result:", result)