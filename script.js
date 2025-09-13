document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const viewingMonthDisplay = document.getElementById('viewing-month-display');

    // モーダル関連のDOM
    const registerModal = document.getElementById('register-modal');
    const showRegisterModalBtn = document.getElementById('show-register-modal-btn');
    const closeModalBtn = document.querySelector('.close-btn');

    const itemForm = document.getElementById('item-form');
    const itemIdInput = document.getElementById('item-id');
    const itemNameInput = document.getElementById('item-name');
    const itemDayInput = document.getElementById('item-day');
    const itemAccountInput = document.getElementById('item-account');
    const registeredItemsList = document.getElementById('registered-items-list');

    const amountForm = document.getElementById('amount-form');
    const amountItemSelect = document.getElementById('amount-item');
    const amountDateInput = document.getElementById('amount-date'); // 追加
    const amountValueInput = document.getElementById('amount-value');

    const scheduleList = document.getElementById('schedule-list');
    const summaryContainer = document.getElementById('summary-container');

    // --- アプリケーションの状態 ---
    let viewingMonth = new Date();
    let items = JSON.parse(localStorage.getItem('paymentItems')) || [];
    let amounts = JSON.parse(localStorage.getItem('paymentAmounts')) || {};

    // --- モーダル制御 ---
    function openModal() {
        registerModal.style.display = 'block';
    }
    function closeModal() {
        registerModal.style.display = 'none';
    }

    // --- データ保存ロジック ---
    function saveItems() {
        localStorage.setItem('paymentItems', JSON.stringify(items));
    }

    function saveAmounts() {
        localStorage.setItem('paymentAmounts', JSON.stringify(amounts));
    }

    // ...(この下の表示更新ロジック等は変更なし) ...
    // --- データ取得ヘルパー ---
    function getMonthlySchedule(monthKey) {
        const monthAmounts = amounts[monthKey] || {};
        const schedule = items.map(item => {
            const amountInfo = monthAmounts[item.id];
            return {
                ...item,
                amount: amountInfo ? amountInfo.amount : null,
                date: amountInfo ? amountInfo.date : null, // 実際の引き落とし日
                paid: amountInfo ? amountInfo.paid : false
            };
        }).filter(item => item.amount !== null);
        // 実際の引き落とし日でソート
        schedule.sort((a, b) => new Date(a.date) - new Date(b.date));
        return schedule;
    }

    // --- 表示更新ロジック ---

    function renderMonthDisplay() {
        viewingMonthDisplay.textContent = `${viewingMonth.getFullYear()}年${String(viewingMonth.getMonth() + 1).padStart(2, '0')}月`;
    }

    function renderRegisteredItems() {
        registeredItemsList.innerHTML = '';
        if (items.length === 0) {
            registeredItemsList.innerHTML = '<li>登録済みの項目はありません。</li>';
            return;
        }
        items.sort((a, b) => a.day - b.day).forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>
                    <strong>${item.name}</strong> (毎月${item.day}日) - ${item.account}
                </span>
                <div class="actions">
                    <button class="edit-btn" data-id="${item.id}">編集</button>
                    <button class="delete-btn" data-id="${item.id}">削除</button>
                </div>
            `;
            registeredItemsList.appendChild(li);
        });
    }

    function updateAmountItemSelect() {
        amountItemSelect.innerHTML = '<option value="">項目を選択...</option>';
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.name} (毎月${item.day}日)`;
            amountItemSelect.appendChild(option);
        });
    }

    function renderSchedule() {
        const viewingMonthKey = `${viewingMonth.getFullYear()}-${String(viewingMonth.getMonth() + 1).padStart(2, '0')}`;
        const schedule = getMonthlySchedule(viewingMonthKey);

        scheduleList.innerHTML = '';
        if (schedule.length === 0) {
            scheduleList.innerHTML = `<li>${viewingMonth.getMonth() + 1}月の支払予定はありません。</li>`;
            return;
        }

        schedule.forEach(item => {
            const li = document.createElement('li');
            li.className = item.paid ? 'paid' : '';
            const displayDate = new Date(item.date).getDate(); //日付から日を抽出
            li.innerHTML = `
                <div class="schedule-details">
                    <div class="schedule-item">
                        <input type="checkbox" class="paid-checkbox" data-id="${item.id}" ${item.paid ? 'checked' : ''}>
                        <span class="schedule-day">${displayDate}日</span>
                        <span class="schedule-name">${item.name}</span>
                        <span class="schedule-account">(${item.account})</span>
                    </div>
                    <span class="schedule-amount">¥${item.amount.toLocaleString()}</span>
                </div>
                <div class="schedule-actions">
                    <button class="edit-amount-btn" data-id="${item.id}">編集</button>
                    <button class="delete-amount-btn" data-id="${item.id}">削除</button>
                </div>
            `;
            scheduleList.appendChild(li);
        });
    }

    function renderSummary() {
        summaryContainer.innerHTML = '';
        const viewingMonthKey = `${viewingMonth.getFullYear()}-${String(viewingMonth.getMonth() + 1).padStart(2, '0')}`;
        const schedule = getMonthlySchedule(viewingMonthKey);

        const unpaid = schedule.filter(item => !item.paid);
        const summaryByAccount = unpaid.reduce((acc, item) => {
            if (!acc[item.account]) {
                acc[item.account] = [];
            }
            acc[item.account].push(item);
            return acc;
        }, {});

        if (Object.keys(summaryByAccount).length === 0) {
            summaryContainer.innerHTML = `<p>${viewingMonth.getMonth() + 1}月の未払いの予定はありません。</p>`;
            return;
        }

        for (const account in summaryByAccount) {
            const accountDiv = document.createElement('div');
            accountDiv.className = 'summary-account';
            
            const payments = summaryByAccount[account];
            let total = 0;
            let checkpoints = '';
            
            payments.forEach(payment => {
                total += payment.amount;
                const displayDate = new Date(payment.date).getDate(); //日付から日を抽出
                checkpoints += `<li>${displayDate}日: ¥${payment.amount.toLocaleString()} (${payment.name})</li>`;
            });

            const lastDate = new Date(payments[payments.length - 1].date).getDate(); //最終日を抽出
            accountDiv.innerHTML = `
                <h3>${account}</h3>
                <ul>${checkpoints}</ul>
                <p>→ ${lastDate}日までに合計 <strong>¥${total.toLocaleString()}</strong> が必要</p>
            `;
            summaryContainer.appendChild(accountDiv);
        }
    }

    function renderAll() {
        renderMonthDisplay();
        renderRegisteredItems();
        updateAmountItemSelect();
        renderSchedule();
        renderSummary();
    }

    // --- イベントリスナー ---

    showRegisterModalBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target == registerModal) {
            closeModal();
        }
    });

    prevMonthBtn.addEventListener('click', () => {
        viewingMonth.setMonth(viewingMonth.getMonth() - 1);
        renderAll();
    });

    nextMonthBtn.addEventListener('click', () => {
        viewingMonth.setMonth(viewingMonth.getMonth() + 1);
        renderAll();
    });

    //【追加】項目選択時に日付を自動入力
    amountItemSelect.addEventListener('change', (e) => {
        const itemId = e.target.value;
        if (!itemId) {
            amountDateInput.value = '';
            return;
        }
        const item = items.find(i => i.id == itemId);
        if (item) {
            const currentYear = viewingMonth.getFullYear();
            const currentMonth = viewingMonth.getMonth();
            // タイムゾーンの問題を避けるため、手動で日付文字列を組み立てる
            const date = new Date(currentYear, currentMonth, item.day);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            amountDateInput.value = `${year}-${month}-${day}`;
        }
    });

    itemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = itemIdInput.value;
        const name = itemNameInput.value.trim();
        const day = parseInt(itemDayInput.value, 10);
        const account = itemAccountInput.value.trim();

        if (!name || !day || !account) {
            alert('すべてのフィールドを入力してください。');
            return;
        }

        if (id) {
            const itemIndex = items.findIndex(item => item.id == id);
            if (itemIndex > -1) {
                items[itemIndex] = { id: Number(id), name, day, account };
            }
        } else {
            const newItem = { id: Date.now(), name, day, account };
            items.push(newItem);
        }

        saveItems();
        itemForm.reset();
        itemIdInput.value = '';
        renderAll();
        closeModal(); // フォーム送信後にモーダルを閉じる
    });

    registeredItemsList.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (!id) return;

        if (e.target.classList.contains('delete-btn')) {
            if (confirm('この項目を削除しますか？\n関連するすべての月の金額情報も削除されます。')) {
                items = items.filter(item => item.id != id);
                for (const monthKey in amounts) {
                    if (amounts[monthKey][id]) {
                        delete amounts[monthKey][id];
                    }
                }
                saveItems();
                saveAmounts();
                renderAll();
            }
        } else if (e.target.classList.contains('edit-btn')) {
            const itemToEdit = items.find(item => item.id == id);
            if (itemToEdit) {
                itemIdInput.value = itemToEdit.id;
                itemNameInput.value = itemToEdit.name;
                itemDayInput.value = itemToEdit.day;
                itemAccountInput.value = itemToEdit.account;
                itemNameInput.focus();
                // 編集ボタンはモーダル内にあるので、再度モーダルを開く必要はない
            }
        }
    });

    amountForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const itemId = amountItemSelect.value;
        const amount = parseInt(amountValueInput.value, 10);
        const date = amountDateInput.value; // 日付を取得

        if (!itemId || isNaN(amount) || !date) { // 日付のチェックも追加
            alert('項目を選択し、有効な日付と金額を入力してください。');
            return;
        }

        const viewingMonthKey = `${viewingMonth.getFullYear()}-${String(viewingMonth.getMonth() + 1).padStart(2, '0')}`;

        if (!amounts[viewingMonthKey]) {
            amounts[viewingMonthKey] = {};
        }
        // 金額と日付を保存
        amounts[viewingMonthKey][itemId] = { amount, date, paid: false };

        saveAmounts();
        amountForm.reset();
        renderAll();
    });

    scheduleList.addEventListener('change', (e) => {
        if (e.target.classList.contains('paid-checkbox')) {
            const id = e.target.dataset.id;
            const isChecked = e.target.checked;
            const viewingMonthKey = `${viewingMonth.getFullYear()}-${String(viewingMonth.getMonth() + 1).padStart(2, '0')}`;

            if (amounts[viewingMonthKey] && amounts[viewingMonthKey][id]) {
                amounts[viewingMonthKey][id].paid = isChecked;
                saveAmounts();
                renderAll();
            }
        }
    });

    // 【追加】月次金額の編集・削除イベント
    scheduleList.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (!id) return;

        const viewingMonthKey = `${viewingMonth.getFullYear()}-${String(viewingMonth.getMonth() + 1).padStart(2, '0')}`;
        const amountData = amounts[viewingMonthKey]?.[id];

        // 削除処理
        if (e.target.classList.contains('delete-amount-btn')) {
            if (confirm('この月の金額情報を削除しますか？')) {
                if (amountData) {
                    delete amounts[viewingMonthKey][id];
                    saveAmounts();
                    renderAll();
                }
            }
        }

        // 編集処理
        if (e.target.classList.contains('edit-amount-btn')) {
            if (amountData) {
                amountItemSelect.value = id;
                amountDateInput.value = amountData.date;
                amountValueInput.value = amountData.amount;
                amountValueInput.focus();
                // フォームにスクロール
                amountForm.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });

    // --- 初期化 ---
    renderAll();
});