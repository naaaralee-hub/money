// 데이터 관리 모듈
const DataManager = (() => {
    const STORAGE_KEY = 'expenses';
    const REMINDERS_KEY = 'reminders';

    // 초기 데이터 로드
    const loadData = () => {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    };

    // 데이터 저장
    const saveData = (expenses) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    };

    // 비용 추가
    const addExpense = (expense) => {
        const expenses = loadData();
        const newExpense = {
            id: Date.now().toString(),
            ...expense,
            createdAt: new Date().toISOString()
        };
        expenses.push(newExpense);
        saveData(expenses);
        return newExpense;
    };

    // 비용 삭제
    const deleteExpense = (id) => {
        const expenses = loadData();
        const filtered = expenses.filter(e => e.id !== id);
        saveData(filtered);
        return filtered;
    };

    // 모든 비용 삭제
    const clearAllExpenses = () => {
        localStorage.removeItem(STORAGE_KEY);
    };

    // 월별 비용 조회
    const getExpensesByMonth = (year, month) => {
        const expenses = loadData();
        return expenses.filter(e => {
            const date = new Date(e.date);
            return date.getFullYear() === year && date.getMonth() === month - 1;
        });
    };

    // 이번 달 비용 조회
    const getCurrentMonthExpenses = () => {
        const now = new Date();
        return getExpensesByMonth(now.getFullYear(), now.getMonth() + 1);
    };

    // 월별 합계 계산
    const getMonthlyTotal = (year, month) => {
        const expenses = getExpensesByMonth(year, month);
        return expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    };

    // 카테고리별 합계
    const getCategoryTotals = (year, month) => {
        const expenses = getExpensesByMonth(year, month);
        const totals = {};
        
        expenses.forEach(e => {
            if (totals[e.category]) {
                totals[e.category] += parseFloat(e.amount);
            } else {
                totals[e.category] = parseFloat(e.amount);
            }
        });
        
        return totals;
    };

    // 입주자별 합계
    const getResidentTotals = (year, month) => {
        const expenses = getExpensesByMonth(year, month);
        const totals = {};
        
        expenses.forEach(e => {
            if (totals[e.resident]) {
                totals[e.resident] += parseFloat(e.amount);
            } else {
                totals[e.resident] = parseFloat(e.amount);
            }
        });
        
        return totals;
    };

    // 전체 비용
    const getTotalExpenses = () => {
        const expenses = loadData();
        return expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    };

    // 평균 비용 (6개월)
    const getAverageExpenses = () => {
        const expenses = loadData();
        if (expenses.length === 0) return 0;
        
        const last6Months = {};
        const now = new Date();

        expenses.forEach(e => {
            const date = new Date(e.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!last6Months[monthKey]) {
                last6Months[monthKey] = 0;
            }
            last6Months[monthKey] += parseFloat(e.amount);
        });

        const months = Object.keys(last6Months).sort().slice(-6);
        const total = months.reduce((sum, month) => sum + last6Months[month], 0);
        return Math.round(total / (months.length || 1));
    };

    // 월별 데이터 (최근 12개월)
    const getMonthlyData = () => {
        const expenses = loadData();
        const monthlyData = {};
        const now = new Date();

        // 최근 12개월 초기화
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyData[monthKey] = 0;
        }

        // 데이터 집계
        expenses.forEach(e => {
            const date = new Date(e.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyData[monthKey] !== undefined) {
                monthlyData[monthKey] += parseFloat(e.amount);
            }
        });

        return monthlyData;
    };

    // 전년도 동월 비용 조회
    const getLastYearMonthExpenses = (month) => {
        const now = new Date();
        const lastYear = now.getFullYear() - 1;
        return getExpensesByMonth(lastYear, month);
    };

    // 전년도 동월 카테고리별 합계
    const getLastYearCategoryTotals = (month) => {
        const expenses = getLastYearMonthExpenses(month);
        const totals = {};
        
        expenses.forEach(e => {
            if (totals[e.category]) {
                totals[e.category] += parseFloat(e.amount);
            } else {
                totals[e.category] = parseFloat(e.amount);
            }
        });
        
        return totals;
    };

    // 전년도 동월 총액
    const getLastYearMonthTotal = (month) => {
        const expenses = getLastYearMonthExpenses(month);
        return expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    };

    // 전년도 대비 비교 데이터
    const getYearOverYearComparison = () => {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        
        const currentTotal = getMonthlyTotal(now.getFullYear(), currentMonth);
        const lastYearTotal = getLastYearMonthTotal(currentMonth);
        
        const difference = currentTotal - lastYearTotal;
        const percentageChange = lastYearTotal !== 0 
            ? ((difference / lastYearTotal) * 100).toFixed(1)
            : 0;

        return {
            currentMonth,
            currentTotal,
            lastYearTotal,
            difference,
            percentageChange
        };
    };

    // 전년도 대비 카테고리별 비교
    const getYearOverYearCategoryComparison = () => {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        
        const currentCategories = getCategoryTotals(now.getFullYear(), currentMonth);
        const lastYearCategories = getLastYearCategoryTotals(currentMonth);
        
        const comparison = {};
        const allCategories = new Set([
            ...Object.keys(currentCategories),
            ...Object.keys(lastYearCategories)
        ]);

        allCategories.forEach(category => {
            const current = currentCategories[category] || 0;
            const lastYear = lastYearCategories[category] || 0;
            const difference = current - lastYear;
            const percentageChange = lastYear !== 0 
                ? ((difference / lastYear) * 100).toFixed(1)
                : (current > 0 ? 100 : 0);

            comparison[category] = {
                current,
                lastYear,
                difference,
                percentageChange
            };
        });

        return comparison;
    };

    // 리마인더 관련 기능
    const loadReminders = () => {
        const data = localStorage.getItem(REMINDERS_KEY);
        return data ? JSON.parse(data) : [];
    };

    const saveReminders = (reminders) => {
        localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    };

    const addReminder = (reminder) => {
        const reminders = loadReminders();
        const newReminder = {
            id: Date.now().toString(),
            ...reminder,
            createdAt: new Date().toISOString()
        };
        reminders.push(newReminder);
        saveReminders(reminders);
        return newReminder;
    };

    const deleteReminder = (id) => {
        const reminders = loadReminders();
        const filtered = reminders.filter(r => r.id !== id);
        saveReminders(filtered);
        return filtered;
    };

    // 데이터 내보내기
    const exportToJson = () => {
        const expenses = loadData();
        const reminders = loadReminders();
        return {
            version: '1.0',
            exportDate: new Date().toISOString(),
            expenses,
            reminders
        };
    };

    // 데이터 복구
    const importFromJson = (data) => {
        if (data.expenses && Array.isArray(data.expenses)) {
            saveData(data.expenses);
        }
        if (data.reminders && Array.isArray(data.reminders)) {
            saveReminders(data.reminders);
        }
    };

    return {
        loadData,
        saveData,
        addExpense,
        deleteExpense,
        clearAllExpenses,
        getExpensesByMonth,
        getCurrentMonthExpenses,
        getMonthlyTotal,
        getCategoryTotals,
        getResidentTotals,
        getTotalExpenses,
        getAverageExpenses,
        getMonthlyData,
        getLastYearMonthExpenses,
        getLastYearCategoryTotals,
        getLastYearMonthTotal,
        getYearOverYearComparison,
        getYearOverYearCategoryComparison,
        loadReminders,
        saveReminders,
        addReminder,
        deleteReminder,
        exportToJson,
        importFromJson
    };
})();
