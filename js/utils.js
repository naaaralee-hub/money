// 유틸리티 함수들
const Utils = (() => {
    // 금액 포맷
    const formatAmount = (amount) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // 날짜 포맷
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    // 날짜 포맷 (YYYY-MM)
    const formatMonthYear = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit'
        });
    };

    // 오늘 날짜 가져오기 (YYYY-MM-DD 형식)
    const getTodayDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // 현재 월 가져오기 (YYYY-MM 형식)
    const getCurrentMonth = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };

    // 토스트 메시지 표시
    const showToast = (message, type = 'success', duration = 3000) => {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    };

    // 모달 표시
    const showConfirmModal = (message, onConfirm, onCancel = null) => {
        const modal = document.getElementById('confirmModal');
        const messageEl = document.getElementById('confirmMessage');
        const confirmBtn = document.getElementById('confirmBtn');
        const cancelBtn = document.getElementById('cancelBtn');

        messageEl.textContent = message;
        modal.classList.add('active');

        const handleConfirm = () => {
            onConfirm();
            closeModal();
        };

        const handleCancel = () => {
            if (onCancel) onCancel();
            closeModal();
        };

        const closeModal = () => {
            modal.classList.remove('active');
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
        };

        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
    };

    // CSV 내보내기
    const exportToCsv = (filename, rows) => {
        const csv = convertToCSV(rows);
        downloadFile(csv, filename, 'text/csv;charset=utf-8;');
    };

    // CSV 변환
    const convertToCSV = (rows) => {
        const headers = Object.keys(rows[0] || {});
        const csvContent = [
            headers.join(','),
            ...rows.map(row =>
                headers.map(field => {
                    const value = row[field];
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');
        return csvContent;
    };

    // Excel 내보내기 (간단한 버전)
    const exportToExcel = (filename, rows) => {
        const headers = Object.keys(rows[0] || {});
        const htmlContent = `
            <table border="1">
                <thead>
                    <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
                        <tr>
                            ${headers.map(h => `<td>${row[h]}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        downloadFile(htmlContent, filename, 'application/vnd.ms-excel;charset=utf-8;');
    };

    // 파일 다운로드
    const downloadFile = (content, filename, type) => {
        const link = document.createElement('a');
        const blob = new Blob([content], { type });
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // JSON 파일 다운로드
    const downloadJson = (data, filename) => {
        const json = JSON.stringify(data, null, 2);
        downloadFile(json, filename, 'application/json;charset=utf-8;');
    };

    // 파일 읽기
    const readFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    };

    // 차트 색상 팔레트
    const chartColors = [
        '#667eea',
        '#764ba2',
        '#f093fb',
        '#4facfe',
        '#00f2fe',
        '#43e97b',
        '#fa709a',
        '#fee140',
        '#30b0fe',
        '#a8edea'
    ];

    const getChartColor = (index) => {
        return chartColors[index % chartColors.length];
    };

    return {
        formatAmount,
        formatDate,
        formatMonthYear,
        getTodayDate,
        getCurrentMonth,
        showToast,
        showConfirmModal,
        exportToCsv,
        exportToExcel,
        downloadJson,
        readFile,
        chartColors,
        getChartColor
    };
})();
