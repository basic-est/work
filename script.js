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
                paid: amountInfo ? amountInfo.paid : false
            };
        }).filter(item => item.amount !== null);
        schedule.sort((a, b) => a.day - b.day);
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
            li.innerHTML = `
                <div class="schedule-item">
                    <input type="checkbox" class="paid-checkbox" data-id="${item.id}" ${item.paid ? 'checked' : ''}>
                    <span class="schedule-day">${item.day}日</span>
                    <span class="schedule-name">${item.name}</span>
                    <span class="schedule-account">(${item.account})</span>
                </div>
                <span class="schedule-amount">¥${item.amount.toLocaleString()}</span>
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
                checkpoints += `<li>${payment.day}日: ¥${payment.amount.toLocaleString()} (${payment.name})</li>`;
            });

            accountDiv.innerHTML = `
                <h3>${account}</h3>
                <ul>${checkpoints}</ul>
                <p>→ ${payments[payments.length - 1].day}日までに合計 <strong>¥${total.toLocaleString()}</strong> が必要</p>
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

        if (!itemId || isNaN(amount)) {
            alert('項目を選択し、有効な金額を入力してください。');
            return;
        }

        const viewingMonthKey = `${viewingMonth.getFullYear()}-${String(viewingMonth.getMonth() + 1).padStart(2, '0')}`;

        if (!amounts[viewingMonthKey]) {
            amounts[viewingMonthKey] = {};
        }
        amounts[viewingMonthKey][itemId] = { amount, paid: false };

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

    // --- 初期化 ---
    renderAll();
});