import { useState } from "react";
import MonthlyChart from "./components/MonthlyChart";
import SavingsGoal from "./components/SavingsGoal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ExpenseTracker() {
  const [transactions, setTransactions] = useState([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date());
  const [type, setType] = useState("income");
  const [error, setError] = useState("");

  const totalIncome = (transactions || [])
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = (transactions || [])
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const handleAdd = () => {
    if (!description.trim()) return setError("Please enter a description.");
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0)
      return setError("Please enter a valid positive amount.");
    if (!date) return setError("Please select a date.");

    // Format date to YYYY-MM-DD for storage consistency
    const formattedDate = date.toISOString().split('T')[0];

    setError("");
    setTransactions([
      ...transactions,
      { id: Date.now(), date: formattedDate, description: description.trim(), amount: amt, type },
    ]);
    setDescription("");
    setAmount("");
    setDate(new Date());
    setType("income");
  };

  const handleDelete = (id) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const fmt = (n) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  const exportCSV = () => {
    if (transactions.length === 0) return;

    const headers = ["Date,Description,Type,Amount"];
    const rows = transactions.map((t) => {
      // Use stored date or fallback to ID if legacy
      const d = t.date || new Date(t.id).toISOString().split('T')[0];
      return `${d},"${t.description}",${t.type},${t.amount}`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);

    // Filename: transactions_YYYY-MM-DD.csv
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `transactions_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>💰 Expense Tracker</h1>
        <p style={styles.headerSub}>Manage your income and expenses</p>
      </div>

      <div style={styles.container}>
        {/* Summary Cards */}
        <div style={styles.cardsRow}>
          <div style={{ ...styles.card, borderTop: "4px solid #6366f1" }}>
            <p style={styles.cardLabel}>Total Balance</p>
            <p style={{ ...styles.cardValue, color: balance >= 0 ? "#16a34a" : "#dc2626" }}>
              {fmt(balance)}
            </p>
          </div>
          <div style={{ ...styles.card, borderTop: "4px solid #16a34a" }}>
            <p style={styles.cardLabel}>Total Income</p>
            <p style={{ ...styles.cardValue, color: "#16a34a" }}>{fmt(totalIncome)}</p>
          </div>
          <div style={{ ...styles.card, borderTop: "4px solid #dc2626" }}>
            <p style={styles.cardLabel}>Total Expenses</p>
            <p style={{ ...styles.cardValue, color: "#dc2626" }}>{fmt(totalExpenses)}</p>
          </div>
        </div>

        {/* Savings Goal */}
        <SavingsGoal currentBalance={balance} transactions={transactions} />

        <div style={styles.body}>
          {/* Form */}
          <div style={styles.formBox}>
            <h2 style={styles.sectionTitle}>Add New Transaction</h2>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Date</label>
              <div style={styles.datePickerWrapper}>
                <DatePicker
                  selected={date}
                  onChange={(date) => setDate(date)}
                  dateFormat="yyyy-MM-dd"
                  className="custom-datepicker"
                  wrapperClassName="date-picker-wrapper"
                />
              </div>
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Description</label>
              <input
                style={styles.input}
                placeholder="e.g. Salary, Groceries..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Amount (USD)</label>
              <input
                style={styles.input}
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Type</label>
              <select
                style={styles.input}
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            {error && <p style={styles.error}>⚠ {error}</p>}
            <button style={styles.addBtn} onClick={handleAdd}>
              + Add Transaction
            </button>
          </div>

          {/* Transaction List */}
          <div style={styles.listBox}>
            <div style={styles.transactionsHeader}>
              <h2 style={styles.sectionTitle}>
                Transactions
                <span style={styles.badge}>{transactions.length}</span>
              </h2>
              <button
                style={{
                  ...styles.exportBtn,
                  opacity: transactions.length === 0 ? 0.5 : 1,
                  cursor: transactions.length === 0 ? 'not-allowed' : 'pointer'
                }}
                onClick={exportCSV}
                disabled={transactions.length === 0}
              >
                Export CSV
              </button>
            </div>

            {transactions.length === 0 ? (
              <div style={styles.empty}>
                <p style={{ fontSize: 36 }}>📋</p>
                <p>No transactions yet.</p>
                <p style={{ fontSize: 13, color: "#9ca3af" }}>Add one using the form.</p>
              </div>
            ) : (
              <div style={styles.txList}>
                {transactions
                  .slice()
                  .reverse()
                  .map((t) => (
                    <div key={t.id} style={styles.txRow}>
                      <div
                        style={{
                          ...styles.txDot,
                          background: t.type === "income" ? "#dcfce7" : "#fee2e2",
                          color: t.type === "income" ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {t.type === "income" ? "▲" : "▼"}
                      </div>
                      <div style={styles.txInfo}>
                        <p style={styles.txDesc}>{t.description}</p>
                        <div style={styles.txMeta}>
                          <span style={styles.txDate}>{t.date || new Date(t.id).toLocaleDateString()}</span>
                          <span
                            style={{
                              ...styles.txType,
                              color: t.type === "income" ? "#16a34a" : "#dc2626",
                            }}
                          >
                            • {t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                          </span>
                        </div>
                      </div>
                      <span
                        style={{
                          ...styles.txAmount,
                          color: t.type === "income" ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {t.type === "income" ? "+" : "-"}
                        {fmt(t.amount)}
                      </span>
                      <button
                        style={styles.deleteBtn}
                        onClick={() => handleDelete(t.id)}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Monthly Trends */}
        <MonthlyChart transactions={transactions} />
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    fontFamily: "'Segoe UI', Arial, sans-serif",
    color: "#111827",
  },
  header: {
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "white",
    padding: "32px 24px",
    textAlign: "center",
  },
  headerTitle: {
    margin: 0,
    fontSize: 30,
    fontWeight: 700,
    letterSpacing: "-0.5px",
  },
  headerSub: {
    margin: "6px 0 0",
    fontSize: 14,
    opacity: 0.85,
  },
  container: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "24px 16px 48px",
  },
  cardsRow: {
    display: "flex",
    gap: 16,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  card: {
    flex: 1,
    minWidth: 180,
    background: "#ffffff",
    borderRadius: 10,
    padding: "18px 20px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  cardLabel: {
    margin: "0 0 8px",
    fontSize: 13,
    color: "#6b7280",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  cardValue: {
    margin: 0,
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: "-0.5px",
  },
  body: {
    display: "grid",
    gridTemplateColumns: "340px 1fr",
    gap: 20,
    alignItems: "start",
  },
  formBox: {
    background: "#ffffff",
    borderRadius: 10,
    padding: "24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  listBox: {
    background: "#ffffff",
    borderRadius: 10,
    padding: "24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    minHeight: 260,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: "#111827",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  transactionsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  exportBtn: {
    padding: "6px 12px",
    fontSize: 13,
    fontWeight: 500,
    color: "#4f46e5",
    background: "#e0e7ff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  badge: {
    background: "#e0e7ff",
    color: "#4f46e5",
    borderRadius: 20,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 600,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    display: "block",
    marginBottom: 5,
    fontSize: 13,
    fontWeight: 500,
    color: "#374151",
  },
  input: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "9px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 7,
    fontSize: 14,
    color: "#111827",
    background: "#fff",
    outline: "none",
  },
  error: {
    color: "#dc2626",
    fontSize: 13,
    margin: "0 0 12px",
    background: "#fee2e2",
    padding: "8px 12px",
    borderRadius: 6,
  },
  addBtn: {
    width: "100%",
    padding: "11px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 4,
    letterSpacing: "0.2px",
  },
  txList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  txRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    background: "#fafafa",
  },
  txDot: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  },
  txInfo: {
    flex: 1,
  },
  txDesc: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: "#111827",
  },
  txMeta: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  txDate: {
    fontSize: 12,
    color: "#6b7280",
  },
  txType: {
    fontSize: 12,
    fontWeight: 500,
    margin: 0,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: 700,
    flexShrink: 0,
  },
  deleteBtn: {
    background: "none",
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    color: "#9ca3af",
    cursor: "pointer",
    width: 28,
    height: 28,
    fontSize: 11,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  empty: {
    textAlign: "center",
    color: "#6b7280",
    padding: "40px 0",
    fontSize: 15,
  },
  // Custom styles for DatePicker to match existing inputs
  datePickerWrapper: {
    width: "100%",
    '& .react-datepicker-wrapper': {
      width: '100%',
    },
    '& .react-datepicker__input-container': {
      width: '100%',
    },
    '& .custom-datepicker': {
      display: "block",
      width: "100%",
      boxSizing: "border-box",
      padding: "9px 12px",
      border: "1px solid #d1d5db",
      borderRadius: 7,
      fontSize: 14,
      color: "#111827",
      background: "#fff",
      outline: "none",
    }
  }
};