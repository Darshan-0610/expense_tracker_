import { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

export default function MonthlyChart({ transactions }) {
    const data = useMemo(() => {
        const map = {};

        transactions.forEach((t) => {
            const date = new Date(t.date || t.id); // Use selected date or fallback to ID
            // Fallback if ID isn't a valid timestamp
            if (isNaN(date.getTime())) return;

            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM

            if (!map[key]) {
                map[key] = { name: key, income: 0, expense: 0, sortKey: date.getTime() };
            }

            if (t.type === 'income') {
                map[key].income += t.amount;
            } else {
                map[key].expense += t.amount;
            }
        });

        const sortedData = Object.values(map).sort((a, b) => a.sortKey - b.sortKey);

        // Format name to "MMM YYYY" for display
        return sortedData.map(item => {
            const [year, month] = item.name.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1);
            return {
                ...item,
                name: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            };
        });
    }, [transactions]);

    if (Object.keys(data).length === 0) {
        return (
            <div style={styles.container}>
                <h3 style={styles.title}>Monthly Trends</h3>
                <div style={styles.placeholder}>
                    <p>No data to show trends.</p>
                    <p style={styles.subText}>Add a transaction to see the chart.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>Monthly Trends</h3>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickMargin={10} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip
                            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="income"
                            name="Income"
                            stroke="#16a34a"
                            strokeWidth={2}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="expense"
                            name="Expenses"
                            stroke="#dc2626"
                            strokeWidth={2}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

const styles = {
    container: {
        background: '#ffffff',
        borderRadius: 10,
        padding: '24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        marginTop: 24,
    },
    title: {
        margin: '0 0 20px',
        fontSize: 16,
        fontWeight: 600,
        color: '#111827',
    },
    placeholder: {
        textAlign: 'center',
        padding: '40px 0',
        color: '#6b7280',
        background: '#f9fafb',
        borderRadius: 8,
        border: '1px dashed #e5e7eb',
    },
    subText: {
        fontSize: 13,
        marginTop: 4,
        opacity: 0.8,
    },
};
