import sqlite3

DATABASE_NAME = "finance.db"

# Database connection

def get_connection():
    connection = sqlite3.connect(DATABASE_NAME)

    # Allows columns to be accessed by name
    connection.row_factory = sqlite3.Row

    return connection

# Database setup

def create_table():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            amount REAL NOT NULL
        )
        """
    )

    connection.commit()
    connection.close()


# Read transactions

def get_all_transactions():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT id, date, description, category, amount
        FROM transactions
        ORDER BY id
        """
    )

    rows = cursor.fetchall()

    connection.close()

    return [dict(row) for row in rows]

# Replace transactions

def replace_transactions(transactions):
    connection = get_connection()
    cursor = connection.cursor()

    # Remove previous dataset
    cursor.execute("DELETE FROM transactions")

    for transaction in transactions:
        cursor.execute(
            """
            INSERT INTO transactions (
                date,
                description,
                category,
                amount
            )
            VALUES (?, ?, ?, ?)
            """,
            (
                transaction["date"],
                transaction["description"],
                transaction["category"],
                transaction["amount"],
            ),
        )

    connection.commit()
    connection.close()

# Update transaction category

def update_transaction_category(transaction_id: int, category: str):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        UPDATE transactions
        SET category = ?
        WHERE id = ?
        """,
        (
            category,
            transaction_id,
        ),
    )

    connection.commit()
    connection.close()

# Add transactions

def add_transactions(transactions):
    connection = get_connection()
    cursor = connection.cursor()

    for transaction in transactions:
        cursor.execute(
            """
            INSERT INTO transactions (
                date,
                description,
                category,
                amount
            )
            VALUES (?, ?, ?, ?)
            """,
            (
                transaction["date"],
                transaction["description"],
                transaction["category"],
                transaction["amount"],
            ),
        )

    connection.commit()
    connection.close()