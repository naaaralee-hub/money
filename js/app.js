// 메인 앱 로직
let categoryChart = null;
let trendsChart = null;

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    renderAllData();
});

// 앱 초기화
const initializeApp = () => {
    // 오늘 날짜 설정
    const dateInput = document.getElementById('date');
    dateInput.value = Utils.getTodayDate();

    const monthFilter = document.getElementById('monthFilter');
    monthFilter.value = Utils.getCurrentMonth();
};

// 이벤트 리스너 설정
const setupEventListeners = () => {
    // 폼 제출
    document.getElementById('expenseForm').addEventListener('submit', handleAddExpense);

    // 탭 전환
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', handleTabChange);
    });

    // 필터링
    document.getElementById('monthFilter').addEventListener('change', handleMonthFilter);

    // 삭제 버튼
    document.getElementById('clearHistoryBtn').addEventListener('click', handleClearHistory);

    // 내보내기 버튼
    document.getElementById('exportExcelBtn').addEventListener('click', handleExportExcel);
    document.getElementById('exportCsvBtn').addEventListener('click', handleExportCsv);
    document.getElementById('backupBtn').addEventListener('click', handleBackup);
    document.getElementById('restoreBtn').addEventListener('click', () => {
        document.getElementById('restoreFile').click();
    });
    document.getElementById('restoreFile').addEventListener('change', handleRestore);
};

// 비용 추가
const handleAddExpense = (e) => {
    e.preventDefault();

    const category = document.getElementById('category').value;
    const amount = document.getElementById('amount').value;
    const date = document.getElementById('date').value;
    const resident = document.getElementById('resident').value;
    const note = document.getElementById('note').value;

    if (!category || !amount || !date || !resident) {
        Utils.showToast('모든 필수 항목을 입력해주세요', 'error');
        return;
    }

    const expense = {
        category,
        amount: parseFloat(amount),
        date,
        resident,
        note
    };

    DataManager.addExpense(expense);
    Utils.showToast('비용이 추가되었습니다', 'success');

    // 폼 리셋
    document.getElementById('expenseForm').reset();
    document.getElementById('date').value = Utils.getTodayDate();

    // 데이터 새로고침
    renderAllData();
};

// 탭 변경
const handleTabChange = (e) => {
    const tabName = e.target.dataset.tab;

    // 탭 버튼 활성화
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');

    // 탭 콘텐츠 표시
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // 탭별 렌더링
    if (tabName === 'analytics') {
        setTimeout(() => {
            renderAnalytics();
        }, 100);
    }
};

// 월 필터링
const handleMonthFilter = () => {
    renderHistory();
};

// 이력 렌더링
const renderHistory = () => {
    const monthFilter = document.getElementById('monthFilter').value;
    const [year, month] = monthFilter.split('-').map(Number);
    
    const expenses = DataManager.getExpensesByMonth(year, month);
    const historyList = document.getElementById('historyList');

    if (expenses.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; color: #999; padding: 30px;">기록이 없습니다</p>';
        return;
    }

    // 날짜순으로 정렬 (최신 먼저)
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    historyList.innerHTML = expenses.map(expense => `
        <div class="history-item">
            <div class="history-item-detail">
                <span class="history-date">${Utils.formatDate(expense.date)}</span>
                <span class="history-category">${expense.category}</span>
            </div>
            <div class="history-item-detail">
                <span class="history-resident">${expense.resident}</span>
                <small style="color: #999;">${expense.note || '메모 없음'}</small>
            </div>
            <div style="text-align: right;">
                <span class="history-amount">${Utils.formatAmount(expense.amount)}</span>
            </div>
            <button class="delete-btn" onclick="handleDeleteExpense('${expense.id}')">삭제</button>
        </div>
    `).join('');
};

// 비용 삭제
const handleDeleteExpense = (id) => {
    Utils.showConfirmModal('이 항목을 삭제하시겠습니까?', () => {
        DataManager.deleteExpense(id);
        Utils.showToast('비용이 삭제되었습니다', 'success');
        renderAllData();
    });
};

// 전체 이력 삭제
const handleClearHistory = () => {
    Utils.showConfirmModal('모든 비용 기록을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.', () => {
        DataManager.clearAllExpenses();
        Utils.showToast('모든 비용이 삭제되었습니다', 'warning');
        renderAllData();
    });
};

// 통계 렌더링
const renderAnalytics = () => {
    const monthData = DataManager.getMonthlyData();
    renderTrendsChart(monthData);
    
    const now = new Date();
    const categoryTotals = DataManager.getCategoryTotals(now.getFullYear(), now.getMonth() + 1);
    renderCategoryChart(categoryTotals);
    
    renderYearOverYearComparison();
    renderSummaryTable();
};

// 카테고리 차트
const renderCategoryChart = (categoryTotals) => {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const colors = labels.map((_, i) => Utils.getChartColor(i));

    if (categoryChart) {
        categoryChart.data.labels = labels;
        categoryChart.data.datasets[0].data = data;
        categoryChart.data.datasets[0].backgroundColor = colors;
        categoryChart.update();
    } else {
        categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [
                    {
                        data,
                        backgroundColor: colors,
                        borderColor: '#fff',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 12 },
                            padding: 15
                        }
                    }
                }
            }
        });
    }
};

// 월별 추이 차트
const renderTrendsChart = (monthData) => {
    const ctx = document.getElementById('trendsChart').getContext('2d');
    
    const labels = Object.keys(monthData).map(month => {
        const [year, monthNum] = month.split('-');
        return `${monthNum}월`;
    });
    const data = Object.values(monthData);

    if (trendsChart) {
        trendsChart.data.labels = labels;
        trendsChart.data.datasets[0].data = data;
        trendsChart.update();
    } else {
        trendsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: '월별 비용',
                        data,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 5,
                        pointBackgroundColor: '#667eea',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            font: { size: 12 }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => Utils.formatAmount(value)
                        }
                    }
                }
            }
        });
    }
};

// 전년도 대비 비교 렌더링
const renderYearOverYearComparison = () => {
    const comparison = DataManager.getYearOverYearComparison();
    const categoryComparison = DataManager.getYearOverYearCategoryComparison();

    // 월 정보 설정
    document.getElementById('yoyCurrentMonth').textContent = comparison.currentMonth;
    document.getElementById('yoyLastYearMonth').textContent = comparison.currentMonth;

    // 총액 비교
    document.getElementById('yoyCurrentTotal').textContent = Utils.formatAmount(comparison.currentTotal);
    document.getElementById('yoyLastYearTotal').textContent = Utils.formatAmount(comparison.lastYearTotal);

    // 증감량 및 비율
    const differenceEl = document.getElementById('yoyDifference');
    const percentageEl = document.getElementById('yoyPercentage');

    differenceEl.textContent = Utils.formatAmount(Math.abs(comparison.difference));
    
    if (comparison.difference > 0) {
        differenceEl.style.color = '#ff6b6b';
        percentageEl.textContent = `+ ${comparison.percentageChange}% ↑`;
        percentageEl.className = 'yoy-percentage negative';
    } else if (comparison.difference < 0) {
        differenceEl.style.color = '#4caf50';
        percentageEl.textContent = `${comparison.percentageChange}% ↓`;
        percentageEl.className = 'yoy-percentage positive';
    } else {
        differenceEl.style.color = '#667eea';
        percentageEl.textContent = '동일 →';
        percentageEl.className = 'yoy-percentage';
    }

    // 카테고리별 비교 테이블
    const tbody = document.getElementById('yoyCategoryTableBody');
    const rows = Object.entries(categoryComparison)
        .sort((a, b) => b[1].current - a[1].current)
        .map(([category, data]) => {
            const isPositive = data.difference > 0;
            const isNegative = data.difference < 0;
            const changeClass = isPositive ? 'negative' : isNegative ? 'positive' : '';

            return `
                <tr>
                    <td>${category}</td>
                    <td class="yoy-amount">${Utils.formatAmount(data.current)}</td>
                    <td class="yoy-amount">${Utils.formatAmount(data.lastYear)}</td>
                    <td class="yoy-amount yoy-change ${changeClass}">${Utils.formatAmount(Math.abs(data.difference))}</td>
                    <td class="yoy-change ${changeClass}">${data.percentageChange}%</td>
                </tr>
            `;
        })
        .join('');

    tbody.innerHTML = rows || '<tr><td colspan="5" style="text-align: center; color: #999;">비교할 데이터가 없습니다</td></tr>';
};

// 월별 요약 테이블
const renderSummaryTable = () => {
    const expenses = DataManager.loadData();
    const monthlyData = {};

    // 월별로 데이터 그룹화
    expenses.forEach(expense => {
        const date = new Date(expense.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                '전기료': 0,
                '수도료': 0,
                '가스료': 0,
                '인터넷': 0,
                '관리비': 0,
                '보험료': 0,
                '기타': 0
            };
        }
        
        if (monthlyData[monthKey][expense.category] !== undefined) {
            monthlyData[monthKey][expense.category] += parseFloat(expense.amount);
        }
    });

    const tbody = document.getElementById('summaryTableBody');
    const rows = Object.keys(monthlyData)
        .sort()
        .reverse()
        .slice(0, 12)
        .map(month => {
            const data = monthlyData[month];
            const total = Object.values(data).reduce((a, b) => a + b, 0);
            const [year, monthNum] = month.split('-');
            
            return `
                <tr>
                    <td>${year}.${monthNum}</td>
                    <td>${Utils.formatAmount(data['전기료'])}</td>
                    <td>${Utils.formatAmount(data['수도료'])}</td>
                    <td>${Utils.formatAmount(data['가스료'])}</td>
                    <td>${Utils.formatAmount(data['인터넷'])}</td>
                    <td>${Utils.formatAmount(data['관리비'])}</td>
                    <td>${Utils.formatAmount(data['기타'])}</td>
                    <td style="font-weight: bold; color: #667eea;">${Utils.formatAmount(total)}</td>
                </tr>
            `;
        })
        .join('');

    tbody.innerHTML = rows || '<tr><td colspan="8" style="text-align: center; color: #999;">데이터가 없습니다</td></tr>';
};

// 카테고리별 비용 분석 렌더링
const renderCategoryBreakdown = () => {
    const now = new Date();
    const categoryTotals = DataManager.getCategoryTotals(now.getFullYear(), now.getMonth() + 1);
    const container = document.getElementById('categoryBreadown');

    if (Object.keys(categoryTotals).length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; grid-column: 1/-1;">이번 달 비용이 없습니다</p>';
        return;
    }

    container.innerHTML = Object.entries(categoryTotals)
        .map(([category, amount]) => `
            <div class="breakdown-item">
                <span class="breakdown-category">${category}</span>
                <span class="breakdown-amount">${Utils.formatAmount(amount)}</span>
            </div>
        `)
        .join('');
};

// 통계 업데이트
const updateStats = () => {
    // 이번 달 총액
    const now = new Date();
    const thisMonthTotal = DataManager.getMonthlyTotal(now.getFullYear(), now.getMonth() + 1);
    document.getElementById('thisMonthTotal').textContent = Utils.formatAmount(thisMonthTotal);

    // 지난달 총액
    const lastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthTotal = DataManager.getMonthlyTotal(lastMonth.getFullYear(), lastMonth.getMonth() + 1);
    document.getElementById('lastMonthTotal').textContent = Utils.formatAmount(lastMonthTotal);

    // 평균
    const average = DataManager.getAverageExpenses();
    document.getElementById('averageTotal').textContent = Utils.formatAmount(average);

    // 전체
    const total = DataManager.getTotalExpenses();
    document.getElementById('totalAll').textContent = Utils.formatAmount(total);
};

// 리마인더 렌더링
const renderReminders = () => {
    const reminders = DataManager.loadReminders();
    const container = document.getElementById('reminders');

    if (reminders.length === 0) {
        container.innerHTML = '<div class="empty-reminder">아직 설정된 리마인더가 없습니다</div>';
        return;
    }

    const now = new Date();
    const upcomingReminders = reminders
        .filter(r => new Date(r.dueDate) >= now)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5);

    if (upcomingReminders.length === 0) {
        container.innerHTML = '<div class="empty-reminder">예정된 리마인더가 없습니다</div>';
        return;
    }

    container.innerHTML = upcomingReminders
        .map(reminder => `
            <div class="reminder-card">
                <div class="reminder-title">${reminder.title}</div>
                <div class="reminder-date">${Utils.formatDate(reminder.dueDate)}</div>
                <small style="color: #666;">${reminder.description || ''}</small>
            </div>
        `)
        .join('');
};

// 데이터 내보내기 - Excel
const handleExportExcel = () => {
    const expenses = DataManager.loadData();
    
    if (expenses.length === 0) {
        Utils.showToast('내보낼 데이터가 없습니다', 'warning');
        return;
    }

    const rows = expenses.map(e => ({
        날짜: Utils.formatDate(e.date),
        분류: e.category,
        금액: Utils.formatAmount(e.amount),
        입주자: e.resident,
        메모: e.note || ''
    }));

    const filename = `공과금_${new Date().toISOString().split('T')[0]}.xlsx`;
    Utils.exportToExcel(filename, rows);
    Utils.showToast('Excel로 내보내기 완료', 'success');
};

// 데이터 내보내기 - CSV
const handleExportCsv = () => {
    const expenses = DataManager.loadData();
    
    if (expenses.length === 0) {
        Utils.showToast('내보낼 데이터가 없습니다', 'warning');
        return;
    }

    const rows = expenses.map(e => ({
        날짜: Utils.formatDate(e.date),
        분류: e.category,
        금액: e.amount,
        입주자: e.resident,
        메모: e.note || ''
    }));

    const filename = `공과금_${new Date().toISOString().split('T')[0]}.csv`;
    Utils.exportToCsv(filename, rows);
    Utils.showToast('CSV로 내보내기 완료', 'success');
};

// 데이터 백업
const handleBackup = () => {
    const data = DataManager.exportToJson();
    const filename = `공과금_백업_${new Date().toISOString().split('T')[0]}.json`;
    Utils.downloadJson(data, filename);
    Utils.showToast('백업 완료', 'success');
};

// 데이터 복구
const handleRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const content = await Utils.readFile(file);
        const data = JSON.parse(content);

        Utils.showConfirmModal('이 데이터로 복구하시겠습니까? 기존 데이터는 덮어씌워집니다.', () => {
            DataManager.importFromJson(data);
            Utils.showToast('데이터 복구 완료', 'success');
            renderAllData();
        });
    } catch (error) {
        Utils.showToast('파일을 읽을 수 없습니다', 'error');
    }

    // 파일 입력 초기화
    e.target.value = '';
};

// 모든 데이터 렌더링
const renderAllData = () => {
    updateStats();
    renderHistory();
    renderCategoryBreakdown();
    renderReminders();
};
