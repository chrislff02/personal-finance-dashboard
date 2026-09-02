# Personal Finance Dashboard

A full-stack personal finance dashboard that lets users upload transaction data, automatically categorize spending, view financial trends, filter transactions, and store data using SQLite.

## Features

- Upload transaction data from CSV files
- Automatically categorize transactions using Python
- Replace or append uploaded transaction data
- Store transactions in SQLite
- View monthly income, expenses, and net balance
- View monthly spending trends
- View spending by category
- Compare income and expenses
- Filter transactions by month
- Search transactions by description
- Filter transactions by category
- Manually update transaction categories
- Save category changes to the database
- Validate CSV files and show upload errors
- Responsive dashboard layout

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Recharts
- CSS

### Backend

- Python
- FastAPI
- Pandas
- Pydantic
- SQLite

## CSV Format

Uploaded CSV files should use this format:

```csv
date,description,amount
Aug 05,Salary,4820
Aug 08,Rent,-1400
Aug 12,Trader Joe's,-620
```

The backend automatically assigns a category to each transaction based on its description.

## Running the Project

### Frontend

- Install the frontend dependencies: npm install
- Start the development server: npm run dev
- The frontend will usually run at: http://localhost:5173

### Backend

- Move into the backend folder: cd backend
- Create a virtual environment: python3 -m venv .venv
- Activate the virtual environment: source .venv/bin/activate
- Install the Python dependencies: pip install -r requirements.txt
- Start the FastAPI server: uvicorn main:app --reload
- The backend will run at: http://127.0.0.1:8000
- FastAPI documentation is available at: http://127.0.0.1:8000/docs

## How It Works

- The user uploads a CSV file.
- FastAPI receives the file.
- Pandas validates and processes the transaction data.
- Python automatically assigns categories to the transactions.
- The transactions are stored in SQLite.
- React fetches the transaction data from FastAPI.
- The dashboard displays financial summaries, charts, and transaction information.

## Future Improvements

- User authentication
- PostgreSQL support
- Budget tracking
- Custom category rules
- More advanced automatic categorization
- Yearly financial summaries
- Cloud deployment
