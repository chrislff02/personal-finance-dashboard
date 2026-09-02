from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd

from database import (
    create_table,
    get_all_transactions,
    replace_transactions,
    add_transactions,
    update_transaction_category,
)

# Data models

class Transaction(BaseModel):
    id: int
    date: str
    description: str
    category: str
    amount: float


class CategoryUpdate(BaseModel):
    category: str

# FASTAPI setup

app = FastAPI()

# Create transactions table when backend starts
create_table()


# CORS configurations

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://personal-finance-dashboard-iota-six.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Basic API routes

@app.get("/")
def read_root():
    return {"message": "Personal Finance API is running"}


@app.get("/transactions", response_model=list[Transaction])
def get_transactions():
    return get_all_transactions()

# Transaction Categorization

def categorize_transaction(description: str) -> str:
    description = description.lower()

    if any(
        keyword in description
        for keyword in ["salary", "payroll", "deposit"]
    ):
        return "Income"

    if any(
        keyword in description
        for keyword in ["trader joe", "whole foods", "walmart", "aldi"]
    ):
        return "Groceries"

    if any(
        keyword in description
        for keyword in ["chipotle", "mcdonald", "restaurant", "doordash"]
    ):
        return "Restaurants"

    if any(
        keyword in description
        for keyword in ["uber", "lyft", "gas", "shell"]
    ):
        return "Transportation"

    if any(
        keyword in description
        for keyword in ["spotify", "netflix", "hulu", "disney"]
    ):
        return "Subscriptions"

    if any(
        keyword in description
        for keyword in ["rent", "electric", "water", "internet"]
    ):
        return "Bills"

    if any(
        keyword in description
        for keyword in ["amc", "cinema", "theatre"]
    ):
        return "Entertainment"

    return "Other"

# CSV upload

@app.post("/upload")
async def upload_csv(
    file: UploadFile = File(...),
    mode: str = "replace",
):
    # Make sure uploaded file is a CSV
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a CSV file.",
        )

    # Read CSV file with Pandas
    try:
        dataframe = pd.read_csv(file.file)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="The CSV file could not be read.",
        )

    # Required columns for every uploaded CSV
    required_columns = {
        "date",
        "description",
        "amount",
    }

    missing_columns = required_columns - set(dataframe.columns)

    if missing_columns:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {', '.join(sorted(missing_columns))}",
        )

    # Keep only columns used by app
    dataframe = dataframe[
        ["date", "description", "amount"]
    ]

    # Reject files containing missing transaction values
    if dataframe[
        ["date", "description", "amount"]
    ].isnull().any().any():
        raise HTTPException(
            status_code=400,
            detail="The CSV contains missing values.",
        )

    # Make sure every amount is numeric
    try:
        dataframe["amount"] = pd.to_numeric(
            dataframe["amount"]
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="The amount column must contain numbers.",
        )

    # Automatically assign a category using the description
    dataframe["category"] = dataframe["description"].apply(
        categorize_transaction
    )

    # Convert Pandas dataframe into transaction dictionaries
    uploaded_transactions = dataframe.to_dict(
        orient="records"
    )

    # Either add to the current data or replace it completely
    if mode == "append":
        add_transactions(uploaded_transactions)
    else:
        replace_transactions(uploaded_transactions)

    return get_all_transactions()

# Update transaction category

@app.patch("/transactions/{transaction_id}")
def update_category(
    transaction_id: int,
    category_update: CategoryUpdate,
):
    update_transaction_category(
        transaction_id,
        category_update.category,
    )

    return {
        "message": "Category updated successfully"
    }