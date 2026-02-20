import { useState, useEffect, useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';

export default function SavingsGoal({ currentBalance, transactions = [] }) {
    const [goal, setGoal] = useState(() => {
        const saved = localStorage.getItem('savingsGoal');
        return saved ? parseFloat(saved) : 0;
    });
    const [isEditing, setIsEditing] = useState(false);
    const [tempGoal, setTempGoal] = useState('');

    useEffect(() => {
        localStorage.setItem('savingsGoal', goal);
    }, [goal]);

    const handleSaveGoal = () => {
        const val = parseFloat(tempGoal);
        if (!isNaN(val) && val >= 0) {
            setGoal(val);
            setIsEditing(false);
        }
    };

    const startEditing = () => {
        setTempGoal(goal.toString());
        setIsEditing(true);
    };

    const progress = goal > 0 ? Math.min((currentBalance / goal) * 100, 100) : 0;
    const isMet = currentBalance >= goal && goal > 0;

    // Color logic: < 75% Green, 75-99% Yellow, 100% (Met) logic handled separately or implicitly
    let progressBarColor = '#16a34a'; // Green
    if (progress >= 75 && progress < 100) {
        progressBarColor = '#eab308'; // Yellow
    } else if (progress >= 100) {
        progressBarColor = '#16a34a'; // Green
    }

    const fmt = (n) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

    // --- Chart Logic ---
    const chartData = useMemo(() => {
        if (!transactions || transactions.length === 0) return [];

        // 1. Sort transactions by date (oldest first)
        const sortedTx = [...transactions].sort((a, b) => {
            const dateA = new Date(a.date || a.id);
            const dateB = new Date(b.date || b.id);
            return dateA - dateB;
        });

        // 2. Aggregate cumulative balance by month
        const map = {};
        let runningBalance = 0;

        // Initialize with a starting point if desired, but here we just trace transactions
        sortedTx.forEach(t => {
            const date = new Date(t.date || t.id);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM

            // Apply transaction to running balance
            if (t.type === 'income') {
                runningBalance += t.amount;
            } else {
                runningBalance -= t.amount;
            }

            // Cleanly format date for display (e.g., "Jan 2024")
            const displayDate = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

            // Store the LAST running balance for that month
            map[key] = {
                date: key,
                name: displayDate,
                balance: runningBalance,
                sortKey: date.getTime()
            };
        });

        // Convert map to array and sort by time
        return Object.values(map).sort((a, b) => a.sortKey - b.sortKey);
    }, [transactions]);

    return (
        <div style={styles.card}>
            <div style={styles.header}>
                <h3 style={styles.title}>Savings Goal</h3>
                {isEditing ? (
                    <div style={styles.editControls}>
                        <input
                            style={styles.input}
                            type="number"
                            value={tempGoal}
                            onChange={(e) => setTempGoal(e.target.value)}
                            autoFocus
                        />
                        <button style={styles.saveBtn} onClick={handleSaveGoal}>Save</button>
                        <button style={styles.cancelBtn} onClick={() => setIsEditing(false)}>✕</button>
                    </div>
                ) : (
                    <button style={styles.editBtn} onClick={startEditing}>
                        Target: {fmt(goal)} ✎
                    </button>
                )}
            </div>

            <div style={styles.progressContainer}>
                <div style={styles.progressBarBg}>
                    <div
                        style={{
                            ...styles.progressBarFill,
                            width: `${progress}%`,
                            backgroundColor: progressBarColor,
                        }}
                    />
                </div>
                <div style={styles.progressLabels}>
                    <span style={styles.currentLabel}>
                        {fmt(currentBalance)} ({Math.round(progress)}%)
                    </span>
                    {isMet && <span style={styles.metLabel}>✅ Goal Met!</span>}
                </div>
            </div>

            {/* Savings Trend Chart */}
            {goal > 0 && chartData.length > 0 && (
                <div style={styles.chartContainer}>
                    <h4 style={styles.chartTitle}>Progress Over Time</h4>
                    <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer>
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#6b7280' }}
                                    minTickGap={30}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#6b7280' }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                                    formatter={(value) => [fmt(value), 'Balance']}
                                />
                                <ReferenceLine y={goal} stroke="#16a34a" strokeDasharray="3 3">
                                    {/* Label logic can be tricky with limited space, omitting for clean look or can add custom label */}
                                </ReferenceLine>
                                <Area
                                    type="monotone"
                                    dataKey="balance"
                                    stroke="#4f46e5"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorBalance)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <p style={styles.chartSub}>Goal: {fmt(goal)} (Shown as Green Line)</p>
                </div>
            )}
        </div>
    );
}

const styles = {
    card: {
        background: '#ffffff',
        borderRadius: 10,
        padding: '24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        marginBottom: 24, // Spacing below summary cards
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        margin: 0,
        fontSize: 16,
        fontWeight: 600,
        color: '#111827',
    },
    editBtn: {
        background: 'none',
        border: '1px solid #e5e7eb',
        borderRadius: 6,
        padding: '4px 8px',
        fontSize: 13,
        color: '#4f46e5',
        cursor: 'pointer',
    },
    editControls: {
        display: 'flex',
        gap: 8,
        alignItems: 'center',
    },
    input: {
        padding: '4px 8px',
        border: '1px solid #d1d5db',
        borderRadius: 4,
        width: 80,
        fontSize: 13,
    },
    saveBtn: {
        background: '#4f46e5',
        color: 'white',
        border: 'none',
        borderRadius: 4,
        padding: '4px 8px',
        fontSize: 12,
        cursor: 'pointer',
    },
    cancelBtn: {
        background: 'none',
        border: 'none',
        color: '#6b7280',
        cursor: 'pointer',
        padding: '4px',
    },
    progressContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    progressBarBg: {
        height: 12,
        background: '#f3f4f6',
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        transition: 'width 0.5s ease-in-out, background-color 0.3s ease',
    },
    progressLabels: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 13,
        fontWeight: 500,
        color: '#374151',
    },
    metLabel: {
        color: '#16a34a',
        fontWeight: 700,
    },
    chartContainer: {
        marginTop: 24,
        paddingTop: 16,
        borderTop: '1px solid #f3f4f6',
    },
    chartTitle: {
        margin: '0 0 12px',
        fontSize: 14,
        fontWeight: 600,
        color: '#4b5563',
    },
    chartSub: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 8,
    }
};
