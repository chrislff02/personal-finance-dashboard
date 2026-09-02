import { useEffect, useRef, useState } from "react";
import "./App.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

type Transaction = {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
};

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const categoryNames = [
  "Income",
  "Bills",
  "Groceries",
  "Restaurants",
  "Transportation",
  "Entertainment",
  "Subscriptions",
  "Other",
];

const categoryColors = [
  "#111827",
  "#374151",
  "#6b7280",
  "#9ca3af",
  "#cbd5e1",
  "#64748b",
];

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
  // State & References
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const currentMonth = new Date().toLocaleString("en-US", {
    month: "short",
  });

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [uploadMode, setUploadMode] = useState("replace");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Load transactions from backend
  useEffect(() => {
    fetch(`${API_URL}/transactions`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch transactions");
        }

        return response.json();
      })
      .then((data) => {
        setTransactions(data);
      })
      .catch((error) => {
        console.error("Error fetching transactions:", error);
        setLoadError("Could not load transaction data.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Csv upload
  async function handleFileUpload(file: File) {
    if (uploadMode === "replace") {
      const confirmed = window.confirm(
        "Replace all existing transaction data with this CSV?",
      );

      if (!confirmed) {
        return;
      }
    }

    const formData = new FormData();

    formData.append("file", file);

    setIsUploading(true);
    setUploadMessage("");
    setUploadError("");

    try {
      const response = await fetch(`${API_URL}/upload?mode=${uploadMode}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.detail || "Failed to upload CSV");
      }

      const data = await response.json();

      setTransactions(data);
      setUploadedFileName(file.name);

      setUploadMessage(
        uploadMode === "append"
          ? "Transactions appended successfully."
          : "Transactions replaced successfully.",
      );
    } catch (error) {
      if (error instanceof Error) {
        setUploadError(error.message);
      } else {
        setUploadError("Something went wrong while uploading the CSV.");
      }
    } finally {
      setIsUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  // Update transaction category
  async function handleCategoryChange(
    transactionId: number,
    newCategory: string,
  ) {
    try {
      const response = await fetch(`${API_URL}/transactions/${transactionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: newCategory,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update category");
      }

      setTransactions((currentTransactions) =>
        currentTransactions.map((transaction) =>
          transaction.id === transactionId
            ? {
                ...transaction,
                category: newCategory,
              }
            : transaction,
        ),
      );
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Could not update the transaction category.");
    }
  }

  // Monthly spending
  const monthlySpending = months.map((month) => {
    const spending = transactions
      .filter(
        (transaction) =>
          transaction.date.startsWith(month) && transaction.amount < 0,
      )
      .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);

    return {
      month,
      spending,
    };
  });

  // Selected month transactions
  const selectedMonthTransactions = transactions.filter((transaction) =>
    transaction.date.startsWith(selectedMonth),
  );

  // Spending by category
  const categorySpending = categoryNames
    .map((category) => {
      const amount = selectedMonthTransactions
        .filter(
          (transaction) =>
            transaction.category === category && transaction.amount < 0,
        )
        .reduce(
          (total, transaction) => total + Math.abs(transaction.amount),
          0,
        );

      return {
        category,
        amount,
      };
    })
    .filter((item) => item.amount > 0);

  // Selected month income & expenses
  const totalIncome = selectedMonthTransactions
    .filter((transaction) => transaction.amount > 0)
    .reduce((total, transaction) => total + transaction.amount, 0);

  const totalExpenses = selectedMonthTransactions
    .filter((transaction) => transaction.amount < 0)
    .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);

  const netAmount = totalIncome - totalExpenses;

  const incomeVsExpenses = [
    {
      name: selectedMonth,
      income: totalIncome,
      expenses: totalExpenses,
    },
  ];

  // Filtered transactions
  const filteredTransactions = selectedMonthTransactions.filter(
    (transaction) => {
      const matchesSearch = transaction.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || transaction.category === selectedCategory;

      return matchesSearch && matchesCategory;
    },
  );

  const displayedTransactions = [...filteredTransactions].sort((a, b) => {
    const dayA = Number(a.date.split(" ")[1]);
    const dayB = Number(b.date.split(" ")[1]);

    return dayB - dayA;
  });

  // Dashboard UI
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-label">FINANCE OVERVIEW</p>
          <h1>Personal Finance Dashboard</h1>
        </div>

        <div className="dashboard-controls">
          <select
            className="month-select"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
          >
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                handleFileUpload(file);
              }
            }}
          />

          <select
            className="upload-mode-select"
            value={uploadMode}
            onChange={(event) => setUploadMode(event.target.value)}
          >
            <option value="replace">Replace Data</option>
            <option value="append">Append Data</option>
          </select>

          <button
            className="upload-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Upload CSV"}
          </button>
        </div>
      </header>

      {isLoading && <p className="loading-message">Loading transactions...</p>}

      {loadError && <p className="upload-error">{loadError}</p>}

      <div className="upload-feedback">
        {uploadedFileName && (
          <p className="uploaded-file">File: {uploadedFileName}</p>
        )}

        {uploadMessage && <p className="upload-success">{uploadMessage}</p>}

        {uploadError && <p className="upload-error">{uploadError}</p>}
      </div>

      {/* Summary Cards */}

      <section className="summary-grid">
        <div className="summary-card">
          <p>Income</p>
          <h2>{formatCurrency(totalIncome)}</h2>
        </div>

        <div className="summary-card">
          <p>Expenses</p>

          <h2>
            $
            {totalExpenses.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </h2>
        </div>

        <div className="summary-card">
          <p>Net</p>
          <h2>{formatCurrency(netAmount)}</h2>
        </div>
      </section>

      {/* Monthly Spending */}

      <section className="dashboard-section">
        <div className="section-header">
          <h2>Monthly Spending</h2>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlySpending}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip
                formatter={(value) => formatChartCurrency(Number(value))}
              />

              <Line
                type="monotone"
                dataKey="spending"
                stroke="#111827"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Smaller Charts */}

      <section className="chart-grid">
        {/* Spending by Category */}

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Spending by Category</h2>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySpending}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {categorySpending.map((entry, index) => (
                    <Cell
                      key={entry.category}
                      fill={categoryColors[index % categoryColors.length]}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value) => formatChartCurrency(Number(value))}
                />

                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income vs Expenses */}

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Income vs Expenses</h2>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeVsExpenses}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="name" />

                <YAxis />

                <Tooltip
                  formatter={(value) => formatChartCurrency(Number(value))}
                />

                <Legend />

                <Bar dataKey="income" fill="#111827" />

                <Bar dataKey="expenses" fill="#6b7280" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Transactions */}

      <section className="dashboard-section">
        <div className="transaction-section-header">
          <h2>{selectedMonth} Transactions</h2>

          <div className="transaction-filters">
            <input
              type="text"
              className="transaction-search"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <select
              className="category-filter"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              <option value="All">All Categories</option>

              {categoryNames.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <button
              className="clear-filters-button"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All");
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="transaction-table-wrapper">
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>
              {displayedTransactions.length > 0 ? (
                displayedTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{transaction.date}</td>
                    <td>{transaction.description}</td>

                    <td>
                      <select
                        value={transaction.category}
                        onChange={(event) =>
                          handleCategoryChange(
                            transaction.id,
                            event.target.value,
                          )
                        }
                      >
                        {categoryNames.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>{formatCurrency(transaction.amount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="no-transactions">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// Formatting helpers
function formatCurrency(amount: number) {
  const formattedAmount = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${amount >= 0 ? "+" : "-"}$${formattedAmount}`;
}

function formatChartCurrency(value: number) {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default App;
