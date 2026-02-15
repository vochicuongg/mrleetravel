/* ============================================================
   app.js — Main Application Logic
   - Tab switching & vehicle rendering
   - Booking modal with calendar picker
   - Language switcher
   - Hotel autocomplete
   - Form submission (WhatsApp/Zalo/Telegram + Cloudflare)
   - Scroll animations & UI interactions
   ============================================================ */

(function () {
    'use strict';

    /* ---------- State ---------- */
    let currentLang = localStorage.getItem('mrlee-lang') || 'en';
    let activeTab = 'motorbikes';
    let selectedDate = null;
    let calendarMonth = new Date().getMonth();
    let calendarYear = new Date().getFullYear();
    let bookingVehicle = null;
    let selectedTourTime = null;
    let selectedDeliveryMethod = 'pickup';
    let selectedClockHour = 8;
    let selectedClockMinute = 0;

    /* ---------- DOM Cache ---------- */
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => ctx.querySelectorAll(sel);

    /* ============================================================
       1. LANGUAGE SWITCHER
       ============================================================ */
    function t(key) {
        return (translations[currentLang] && translations[currentLang][key]) || key;
    }

    function applyTranslations() {
        $$('[data-translate]').forEach(el => {
            const key = el.getAttribute('data-translate');
            const val = t(key);
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = val;
            } else {
                el.textContent = val;
            }
        });

        // Update calendar weekdays & month
        renderCalendar();

        // Update currently open vehicle cards
        renderVehicles(activeTab);
    }

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('mrlee-lang', lang);

        // Update flag & label
        const btn = $('#langBtn');
        if (btn) {
            const img = $('img', btn);
            const span = $('span', btn);
            if (img) img.src = `assets/images/languages/${lang}.png`;
            if (span) span.textContent = lang.toUpperCase();
        }

        applyTranslations();
        closeLangDropdown();
    }

    function toggleLangDropdown() {
        const dd = $('#langDropdown');
        dd.classList.toggle('open');
    }

    function closeLangDropdown() {
        const dd = $('#langDropdown');
        if (dd) dd.classList.remove('open');
    }

    /* ============================================================
       2. TAB SWITCHING & VEHICLE RENDERING
       ============================================================ */
    function switchTab(tab) {
        activeTab = tab;

        $$('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        renderVehicles(tab);
    }

    function formatPrice(price) {
        return new Intl.NumberFormat('vi-VN').format(price);
    }

    /* Feature icon mapping for product detail popup */
    const featureIcons = {
        feat_automatic: 'fa-solid fa-gear',
        feat_manual: 'fa-solid fa-gear',
        feat_125cc: 'fa-solid fa-gauge',
        feat_150cc: 'fa-solid fa-gauge-high',
        feat_helmet: 'fa-solid fa-hard-hat',
        feat_delivery: 'fa-solid fa-truck',
        feat_4seats: 'fa-solid fa-users',
        feat_16seats: 'fa-solid fa-bus',
        feat_private: 'fa-solid fa-lock',
        feat_guide: 'fa-solid fa-map',
        feat_sunrise_sunset: 'fa-solid fa-sun',
        feat_airport: 'fa-solid fa-plane',
        feat_ac: 'fa-solid fa-snowflake',
        feat_luggage: 'fa-solid fa-suitcase'
    };

    function renderVehicles(category) {
        const grid = $('#vehicleGrid');
        if (!grid) return;

        const items = vehicleData[category] || [];

        grid.innerHTML = items.map(v => `
      <div class="vehicle-card fade-in" data-vehicle-id="${v.id}" style="cursor:pointer">
        <div class="vehicle-card-img">
          <img src="${v.image}" alt="${v.nameKey}" loading="lazy">
        </div>
        <div class="vehicle-card-body">
          <h3 class="vehicle-card-title">${v.nameKey}</h3>
          <div class="vehicle-card-features">
            ${v.features.map(f => `<span>${t(f)}</span>`).join('')}
          </div>
          <div class="vehicle-card-footer">
            <div class="vehicle-card-price">
              ${formatPrice(v.price)} <small>${v.currency} ${t(v.priceUnit)}</small>
            </div>
            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); app.openBooking('${v.id}')">
              ${t('book_now')}
            </button>
          </div>
        </div>
      </div>
    `).join('');

        // Trigger fade-in animation
        requestAnimationFrame(() => {
            $$('.vehicle-card.fade-in', grid).forEach((card, i) => {
                setTimeout(() => card.classList.add('visible'), i * 80);
            });
        });
    }

    // Event delegation for vehicle card clicks (product detail popup)
    document.addEventListener('click', e => {
        const card = e.target.closest('.vehicle-card[data-vehicle-id]');
        if (card && !e.target.closest('.btn')) {
            openProduct(card.dataset.vehicleId);
        }
    });

    /* ============================================================
       2B. PRODUCT DETAIL POPUP
       ============================================================ */
    function openProduct(vehicleId) {
        let vehicle = null;
        for (const cat of Object.keys(vehicleData)) {
            const found = vehicleData[cat].find(v => v.id === vehicleId);
            if (found) {
                vehicle = found;
                vehicle._category = cat;
                break;
            }
        }
        if (!vehicle) return;

        // Populate modal
        const img = $('#productImg');
        const title = $('#productTitle');
        const price = $('#productPrice');
        const features = $('#productFeatures');
        const bookBtn = $('#productBookBtn');

        if (img) { img.src = vehicle.image; img.alt = vehicle.nameKey; }
        if (title) title.textContent = vehicle.nameKey;
        if (price) price.innerHTML = `${formatPrice(vehicle.price)} <small>${vehicle.currency} ${t(vehicle.priceUnit)}</small>`;
        if (features) {
            features.innerHTML = vehicle.features.map(f => {
                const icon = featureIcons[f] || 'fa-solid fa-check';
                return `<span><i class="${icon}"></i>${t(f)}</span>`;
            }).join('');
        }

        // Book button → opens booking modal
        if (bookBtn) {
            bookBtn.onclick = () => {
                closeProduct();
                setTimeout(() => openBooking(vehicleId), 300);
            };
        }

        // Show overlay
        const overlay = $('#productOverlay');
        if (overlay) overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeProduct() {
        const overlay = $('#productOverlay');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    /* ============================================================
       3. BOOKING MODAL
       ============================================================ */
    function openBooking(vehicleId) {
        // Find vehicle across all categories
        bookingVehicle = null;
        for (const cat of Object.keys(vehicleData)) {
            const found = vehicleData[cat].find(v => v.id === vehicleId);
            if (found) {
                bookingVehicle = found;
                bookingVehicle._category = cat;
                break;
            }
        }

        if (!bookingVehicle) return;

        // Set modal title based on category
        const titleEl = $('#modalTitle');
        if (titleEl) {
            const cat = bookingVehicle._category;
            const titleKey = cat === 'jeeps' ? 'modal_title_jeep'
                : cat === 'minibuses' ? 'modal_title_minibus'
                    : 'modal_title_motorbike';
            titleEl.textContent = `${t(titleKey)} — ${bookingVehicle.nameKey}`;
        }

        // Show/hide jeep-specific tour time selector
        const tourSelector = $('#tourTimeSelector');
        if (tourSelector) {
            if (bookingVehicle._category === 'jeeps') {
                tourSelector.classList.add('visible');
            } else {
                tourSelector.classList.remove('visible');
            }
        }

        // Reset form
        selectedDate = null;
        selectedTourTime = null;
        selectedDeliveryMethod = 'pickup';
        selectedClockHour = 8;
        selectedClockMinute = 0;
        clockMode = 'hour';
        $$('.tour-time-option').forEach(el => el.classList.remove('selected'));
        $('#bookingName').value = '';
        $('#bookingPhone').value = '';
        const deliveryFields = $('#deliveryFields');
        if (deliveryFields) deliveryFields.style.display = 'none';
        const deliveryNameInput = $('#deliveryName');
        if (deliveryNameInput) deliveryNameInput.value = '';
        const deliveryAddr = $('#deliveryAddress');
        if (deliveryAddr) deliveryAddr.value = '';
        $$('.delivery-option').forEach(el => {
            el.classList.toggle('selected', el.dataset.method === 'pickup');
        });
        switchClockMode('hour');
        $('#bookingNotes').value = '';

        // Show/hide rental duration & promo for motorbikes
        const rentalGroup = $('#rentalDurationGroup');
        const promoBanner = $('#promoBanner');
        if (bookingVehicle._category === 'motorbikes') {
            if (rentalGroup) {
                rentalGroup.style.display = '';
                const daysInput = $('#rentalDays');
                if (daysInput) daysInput.value = 1;
                updateRentalPrice();
            }
            if (promoBanner) renderPromoBanner();
        } else {
            if (rentalGroup) rentalGroup.style.display = 'none';
            if (promoBanner) promoBanner.style.display = 'none';
        }

        // Open modal
        const overlay = $('#bookingOverlay');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';

        // Render calendar
        renderCalendar();
    }

    function closeBooking() {
        const overlay = $('#bookingOverlay');
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    function selectTourTime(time) {
        selectedTourTime = time;
        $$('.tour-time-option').forEach(el => {
            el.classList.toggle('selected', el.dataset.time === time);
        });
    }

    /* ============================================================
       4. CUSTOM CALENDAR PICKER
       ============================================================ */
    function renderCalendar() {
        const monthLabel = $('#calendarMonth');
        const daysContainer = $('#calendarDays');
        const weekdaysContainer = $('#calendarWeekdays');

        if (!monthLabel || !daysContainer) return;

        // Month label
        monthLabel.textContent = `${t('month_' + (calendarMonth + 1))} ${calendarYear}`;

        // Weekday headers
        if (weekdaysContainer) {
            const dayKeys = ['cal_mon', 'cal_tue', 'cal_wed', 'cal_thu', 'cal_fri', 'cal_sat', 'cal_sun'];
            weekdaysContainer.innerHTML = dayKeys.map(k => `<span>${t(k)}</span>`).join('');
        }

        // Calculate days
        const firstDay = new Date(calendarYear, calendarMonth, 1);
        const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
        const startWeekday = (firstDay.getDay() + 6) % 7; // Mon=0
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let html = '';

        // Empty cells before first day
        for (let i = 0; i < startWeekday; i++) {
            html += '<div class="calendar-day empty"></div>';
        }

        // Day cells
        for (let d = 1; d <= lastDay.getDate(); d++) {
            const date = new Date(calendarYear, calendarMonth, d);
            const isPast = date < today;
            const isToday = date.getTime() === today.getTime();
            const isSelected = selectedDate &&
                selectedDate.getDate() === d &&
                selectedDate.getMonth() === calendarMonth &&
                selectedDate.getFullYear() === calendarYear;

            let cls = 'calendar-day';
            if (isPast) cls += ' disabled';
            if (isToday) cls += ' today';
            if (isSelected) cls += ' selected';

            html += `<div class="${cls}" data-day="${d}" ${isPast ? '' : `onclick="app.selectDate(${d})"`}>${d}</div>`;
        }

        daysContainer.innerHTML = html;
    }

    function selectDate(day) {
        selectedDate = new Date(calendarYear, calendarMonth, day);
        renderCalendar();
    }

    /* ---------- Rental duration discount ---------- */
    function getDiscountedPrice(vehicle, days) {
        if (!vehicle || vehicle._category !== 'motorbikes') return vehicle ? vehicle.price : 0;

        const name = vehicle.nameKey.toLowerCase();
        const isPremium = name.includes('pcx') || name.includes('nvx');
        const isStandard = name.includes('vision') || name.includes('air blade') || name.includes('lead');

        if (days >= 25) {
            return isPremium ? 150000 : 100000;
        } else if (days >= 5 && isStandard) {
            return 130000;
        }
        return vehicle.price;
    }

    function renderPromoBanner() {
        const banner = $('#promoBanner');
        if (!banner || !bookingVehicle || bookingVehicle._category !== 'motorbikes') {
            if (banner) banner.style.display = 'none';
            return;
        }

        const name = bookingVehicle.nameKey.toLowerCase();
        const isPremium = name.includes('pcx') || name.includes('nvx');
        const isStandard = name.includes('vision') || name.includes('air blade') || name.includes('lead');
        const basePrice = bookingVehicle.price;

        let items = [];

        // Tier 1: 5+ days (only for standard bikes)
        if (isStandard) {
            items.push({ days: 5, price: 130000 });
        }

        // Tier 2: 25+ days (all bikes)
        if (isPremium) {
            items.push({ days: 25, price: 150000 });
        } else {
            items.push({ days: 25, price: 100000 });
        }

        // Filter out tiers that don't actually save money
        items = items.filter(it => it.price < basePrice);

        if (items.length === 0) {
            banner.style.display = 'none';
            return;
        }

        const vehicleLabel = bookingVehicle.nameKey;
        const listHtml = items.map(it =>
            `<li>` +
            `<span class="promo-bullet">🏷️</span>` +
            `<div class="promo-item-text">` +
            `<span class="promo-price">${t('promo_from')} ${it.days} ${t('days_unit')}: <strong>${formatPrice(it.price)}đ/${t('per_day')}</strong></span>` +
            `<span class="promo-save">${t('promo_save')} ${formatPrice(basePrice - it.price)}đ/${t('per_day')}</span>` +
            `</div>` +
            `</li>`
        ).join('');

        banner.innerHTML =
            `<div class="promo-title">🎉 ${t('promo_title')} — ${vehicleLabel}</div>` +
            `<ul class="promo-list">${listHtml}</ul>`;
        banner.style.display = '';
    }

    function updateRentalPrice() {
        const display = $('#rentalPriceDisplay');
        if (!display || !bookingVehicle) return;

        const daysInput = $('#rentalDays');
        let days = parseInt(daysInput ? daysInput.value : 1) || 1;
        if (days < 1) days = 1;
        if (days > 90) days = 90;
        if (daysInput) daysInput.value = days;

        const originalPrice = bookingVehicle.price;
        const discountPrice = getDiscountedPrice(bookingVehicle, days);
        const total = discountPrice * days;

        if (discountPrice < originalPrice) {
            display.innerHTML =
                `<div class="rental-discount-badge">🎉 ${t('discount_label')}</div>` +
                `<div class="rental-price-line">` +
                `<span class="rental-price-original">${formatPrice(originalPrice)}đ</span> → ` +
                `<span class="rental-price-new">${formatPrice(discountPrice)}đ/${t('per_day')}</span>` +
                `</div>` +
                `<div class="rental-total">${t('total_label')}: <strong>${formatPrice(total)}đ</strong> (${days} ${t('days_unit')})</div>`;
        } else {
            display.innerHTML =
                `<div class="rental-price-line">${formatPrice(originalPrice)}đ/${t('per_day')}</div>` +
                `<div class="rental-total">${t('total_label')}: <strong>${formatPrice(total)}đ</strong> (${days} ${t('days_unit')})</div>`;
        }
    }

    function adjustDays(delta) {
        const input = $('#rentalDays');
        if (!input) return;
        let val = (parseInt(input.value) || 1) + delta;
        if (val < 1) val = 1;
        if (val > 90) val = 90;
        input.value = val;
        updateRentalPrice();
    }

    function prevMonth() {
        calendarMonth--;
        if (calendarMonth < 0) {
            calendarMonth = 11;
            calendarYear--;
        }
        renderCalendar();
    }

    function nextMonth() {
        calendarMonth++;
        if (calendarMonth > 11) {
            calendarMonth = 0;
            calendarYear++;
        }
        renderCalendar();
    }

    /* ============================================================
       4B. ANALOG CLOCK PICKER (two-phase: hour → minute)
       ============================================================ */
    let clockMode = 'hour'; // 'hour' or 'minute'

    function initClockPicker() {
        const svg = $('#clockSvg');
        const picker = $('#clockPicker');
        if (!svg || !picker) return;

        renderClockFace();
        updateClockHand();

        // Drag interaction
        let isDragging = false;

        function getAngleFromEvent(e) {
            const rect = svg.getBoundingClientRect();
            const touch = e.touches ? e.touches[0] : e;
            const x = touch.clientX - rect.left - rect.width / 2;
            const y = touch.clientY - rect.top - rect.height / 2;
            let angle = Math.atan2(y, x) * 180 / Math.PI + 90;
            if (angle < 0) angle += 360;
            return angle;
        }

        function snapValue(angle) {
            if (clockMode === 'hour') {
                // 16 positions (6-21), each 22.5 degrees
                const hourValues = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
                let idx = Math.round(angle / 22.5) % 16;
                if (idx < 0) idx += 16;
                return hourValues[idx];
            } else {
                // 12 positions (0,5,10...55), each 30 degrees
                let idx = Math.round(angle / 30);
                if (idx >= 12) idx = 0;
                return idx * 5;
            }
        }

        function onDragStart(e) {
            e.preventDefault();
            isDragging = true;
            picker.classList.add('dragging');
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
            onDragMove(e);
        }

        function onDragMove(e) {
            if (!isDragging) return;
            e.preventDefault();
            const angle = getAngleFromEvent(e);
            const val = snapValue(angle);
            if (clockMode === 'hour') {
                selectedClockHour = val;
            } else {
                selectedClockMinute = val;
            }
            updateClockHand();
        }

        function onDragEnd() {
            if (!isDragging) return;
            const wasDragging = isDragging;
            isDragging = false;
            picker.classList.remove('dragging');
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';

            // Auto-switch from hour to minute after drag ends
            if (wasDragging && clockMode === 'hour') {
                setTimeout(() => switchClockMode('minute'), 250);
            }
        }

        // Mouse events
        svg.addEventListener('mousedown', onDragStart);
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);

        // Touch events
        svg.addEventListener('touchstart', onDragStart, { passive: false });
        document.addEventListener('touchmove', onDragMove, { passive: false });
        document.addEventListener('touchend', onDragEnd);

        // Click on number to select
        const numbersG = $('#clockNumbers');
        if (numbersG) {
            numbersG.addEventListener('click', e => {
                const num = e.target.closest('.clock-number');
                if (!num) return;
                const val = parseInt(num.dataset.value);
                if (clockMode === 'hour') {
                    selectedClockHour = val;
                    updateClockHand();
                    setTimeout(() => switchClockMode('minute'), 250);
                } else {
                    selectedClockMinute = val;
                    updateClockHand();
                }
            });
        }

        // Display click handlers to switch mode
        const hourDisplay = $('#clockHourDisplay');
        const minDisplay = $('#clockMinDisplay');
        if (hourDisplay) hourDisplay.addEventListener('click', () => switchClockMode('hour'));
        if (minDisplay) minDisplay.addEventListener('click', () => switchClockMode('minute'));
    }

    function switchClockMode(mode) {
        clockMode = mode;
        renderClockFace();
        updateClockHand();
    }

    function renderClockFace() {
        const numbersG = $('#clockNumbers');
        const ticksG = $('#clockTicks');
        if (!numbersG) return;

        const cx = 100, cy = 100, numR = 66;

        numbersG.innerHTML = '';
        if (ticksG) ticksG.innerHTML = '';

        if (clockMode === 'hour') {
            // 16 hour numbers (6-21) at 22.5-degree intervals
            const hourValues = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
            for (let i = 0; i < 16; i++) {
                const h = hourValues[i];
                const angle = (i * 22.5 - 90) * Math.PI / 180;
                const x = cx + numR * Math.cos(angle);
                const y = cy + numR * Math.sin(angle);
                const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                txt.setAttribute('x', x);
                txt.setAttribute('y', y);
                txt.setAttribute('class', 'clock-number');
                txt.setAttribute('data-value', h);
                txt.textContent = h;
                numbersG.appendChild(txt);
            }
        } else {
            // 12 minute labels: 05, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 00
            const minuteValues = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 0];
            for (let i = 0; i < 12; i++) {
                const val = minuteValues[i];
                const angle = ((i + 1) * 30 - 90) * Math.PI / 180;
                const x = cx + numR * Math.cos(angle);
                const y = cy + numR * Math.sin(angle);
                const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                txt.setAttribute('x', x);
                txt.setAttribute('y', y);
                txt.setAttribute('class', 'clock-number');
                txt.setAttribute('data-value', val);
                txt.textContent = String(val).padStart(2, '0');
                numbersG.appendChild(txt);
            }
        }

        // Render ticks
        if (ticksG) {
            const tickOutR = 82, tickInR = 78, tickInRMaj = 76;
            for (let m = 0; m < 60; m++) {
                const angle = (m * 6 - 90) * Math.PI / 180;
                const isMajor = m % 5 === 0;
                const inR = isMajor ? tickInRMaj : tickInR;
                const x1 = cx + inR * Math.cos(angle);
                const y1 = cy + inR * Math.sin(angle);
                const x2 = cx + tickOutR * Math.cos(angle);
                const y2 = cy + tickOutR * Math.sin(angle);
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x1);
                line.setAttribute('y1', y1);
                line.setAttribute('x2', x2);
                line.setAttribute('y2', y2);
                line.setAttribute('class', 'clock-tick' + (isMajor ? ' major' : ''));
                ticksG.appendChild(line);
            }
        }

        // Update display active state
        const hourDisplay = $('#clockHourDisplay');
        const minDisplay = $('#clockMinDisplay');
        if (hourDisplay) hourDisplay.classList.toggle('active', clockMode === 'hour');
        if (minDisplay) minDisplay.classList.toggle('active', clockMode === 'minute');
    }

    function updateClockHand() {
        const hand = $('#clockHand');
        const knob = $('#clockKnob');
        if (!hand) return;

        const cx = 100, cy = 100, handR = 70;
        let angleDeg;

        if (clockMode === 'hour') {
            const hourValues = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
            const idx = hourValues.indexOf(selectedClockHour);
            angleDeg = idx >= 0 ? idx * 22.5 : 0;
        } else {
            angleDeg = selectedClockMinute * 6;
        }

        const angle = (angleDeg - 90) * Math.PI / 180;
        const x2 = cx + handR * Math.cos(angle);
        const y2 = cy + handR * Math.sin(angle);

        hand.setAttribute('x2', x2);
        hand.setAttribute('y2', y2);
        if (knob) {
            knob.setAttribute('cx', x2);
            knob.setAttribute('cy', y2);
        }

        // Update display text
        const hourDisplay = $('#clockHourDisplay');
        const minDisplay = $('#clockMinDisplay');
        if (hourDisplay) hourDisplay.textContent = String(selectedClockHour).padStart(2, '0');
        if (minDisplay) minDisplay.textContent = String(selectedClockMinute).padStart(2, '0');

        // Highlight active number
        $$('.clock-number').forEach(el => {
            const val = parseInt(el.dataset.value);
            if (clockMode === 'hour') {
                el.classList.toggle('active', val === selectedClockHour);
            } else {
                el.classList.toggle('active', val === selectedClockMinute);
            }
        });
    }

    /* ============================================================
       5. HOTEL AUTOCOMPLETE (Delivery)
       ============================================================ */
    function initAutocomplete() {
        // Hotel Name autocomplete
        setupHotelAutocomplete('#deliveryName', '#hotelAutocomplete', 'name');
        // Address autocomplete
        setupHotelAutocomplete('#deliveryAddress', '#addressAutocomplete', 'both');
    }

    function setupHotelAutocomplete(inputSel, listSel, searchBy) {
        const input = $(inputSel);
        const list = $(listSel);
        if (!input || !list) return;

        function renderList(matches) {
            if (matches.length === 0) {
                list.classList.remove('open');
                return;
            }
            list.innerHTML = matches.map((h, i) =>
                `<div class="autocomplete-item" data-index="${hotelList.indexOf(h)}" onclick="app.selectHotel(${hotelList.indexOf(h)})">
                    <div class="autocomplete-name">${h.name}</div>
                    <div class="autocomplete-address">${h.address}</div>
                </div>`
            ).join('');
            list.classList.add('open');
        }

        // Show all on focus
        input.addEventListener('focus', () => {
            const val = input.value.toLowerCase().trim();
            if (val.length < 2) {
                renderList(hotelList);
            }
        });

        input.addEventListener('input', () => {
            const val = input.value.toLowerCase().trim();
            if (val.length < 2) {
                renderList(hotelList);
                return;
            }

            const matches = hotelList.filter(h => {
                if (searchBy === 'both') {
                    return h.name.toLowerCase().includes(val) || h.address.toLowerCase().includes(val);
                }
                return h.name.toLowerCase().includes(val);
            });
            renderList(matches);
        });

        input.addEventListener('blur', () => {
            setTimeout(() => list.classList.remove('open'), 200);
        });
    }

    function selectHotel(index) {
        const hotel = hotelList[index];
        if (!hotel) return;
        const nameInput = $('#deliveryName');
        const addrInput = $('#deliveryAddress');
        if (nameInput) nameInput.value = hotel.name;
        if (addrInput) addrInput.value = hotel.address;
        const list1 = $('#hotelAutocomplete');
        const list2 = $('#addressAutocomplete');
        if (list1) list1.classList.remove('open');
        if (list2) list2.classList.remove('open');
    }

    /* ============================================================
       6. FORM SUBMISSION (WhatsApp / Zalo / Telegram + CF Worker)
       ============================================================ */
    function getBookingData() {
        const name = $('#bookingName').value.trim();
        const phone = $('#bookingPhone').value.trim();
        const clockTime = `${String(selectedClockHour).padStart(2, '0')}:${String(selectedClockMinute).padStart(2, '0')}`;
        const notes = $('#bookingNotes').value.trim();

        if (!name || !phone) {
            showToast(t('toast_error'));
            return null;
        }

        // Delivery info
        let deliveryInfo = t('delivery_pickup');
        if (selectedDeliveryMethod === 'delivery') {
            const recipientName = $('#deliveryName') ? $('#deliveryName').value.trim() : '';
            const address = $('#deliveryAddress') ? $('#deliveryAddress').value.trim() : '';
            deliveryInfo = `${t('delivery_deliver')}: ${recipientName} — ${address}`;
        }

        const dateStr = selectedDate
            ? `${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`
            : '';

        // Rental days & pricing for motorbikes
        let rentalDays = 1;
        let priceStr = bookingVehicle ? `${formatPrice(bookingVehicle.price)}đ` : '';
        if (bookingVehicle && bookingVehicle._category === 'motorbikes') {
            const daysInput = $('#rentalDays');
            rentalDays = parseInt(daysInput ? daysInput.value : 1) || 1;
            const discounted = getDiscountedPrice(bookingVehicle, rentalDays);
            const total = discounted * rentalDays;
            priceStr = discounted < bookingVehicle.price
                ? `${formatPrice(discounted)}đ/${t('per_day')} × ${rentalDays} ${t('days_unit')} = ${formatPrice(total)}đ (${t('discount_label')})`
                : `${formatPrice(bookingVehicle.price)}đ/${t('per_day')} × ${rentalDays} ${t('days_unit')} = ${formatPrice(total)}đ`;
        }

        return {
            vehicle: bookingVehicle ? bookingVehicle.nameKey : '',
            category: bookingVehicle ? bookingVehicle._category : '',
            name,
            phone,
            delivery: deliveryInfo,
            date: dateStr,
            time: bookingVehicle && bookingVehicle._category === 'jeeps' && selectedTourTime
                ? t('tour_' + selectedTourTime) : clockTime,
            notes,
            price: priceStr,
            rentalDays
        };
    }

    function buildMessage(data) {
        return [
            `🚀 *${t('modal_title')}*`,
            `━━━━━━━━━━━━━━`,
            `🚗 ${data.vehicle}`,
            `💰 ${data.price}`,
            `📅 ${data.date}`,
            `⏰ ${data.time}`,
            `👤 ${data.name}`,
            `📱 ${data.phone}`,
            `🚚 ${data.delivery}`,
            data.notes ? `📝 ${data.notes}` : ''
        ].filter(Boolean).join('\n');
    }

    function submitWhatsApp() {
        const data = getBookingData();
        if (!data) return;
        const msg = encodeURIComponent(buildMessage(data));
        const phoneNumber = '84123456789'; // Replace with actual phone number
        window.open(`https://wa.me/${phoneNumber}?text=${msg}`, '_blank');
        submitToCloudflare(data);
        closeBooking();
        showToast(t('toast_success'));
    }

    function submitZalo() {
        const data = getBookingData();
        if (!data) return;
        const msg = encodeURIComponent(buildMessage(data));
        window.open(`https://zalo.me/84123456789`, '_blank');
        submitToCloudflare(data);
        closeBooking();
        showToast(t('toast_success'));
    }

    function submitTelegram() {
        const data = getBookingData();
        if (!data) return;
        const msg = encodeURIComponent(buildMessage(data));
        window.open(`https://t.me/mrleetravel?text=${msg}`, '_blank');
        submitToCloudflare(data);
        closeBooking();
        showToast(t('toast_success'));
    }

    /* --- Cloudflare Worker Integration --- */
    async function submitToCloudflare(data) {
        try {
            const WORKER_URL = 'https://booking-worker.mrlee.workers.dev'; // Replace with actual worker URL
            await fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    timestamp: new Date().toISOString(),
                    lang: currentLang
                })
            });
        } catch (err) {
            console.warn('Cloudflare Worker submission failed:', err);
        }
    }

    /* ============================================================
       7. TOAST NOTIFICATIONS
       ============================================================ */
    function showToast(message) {
        const toast = $('#toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3500);
    }

    /* ============================================================
       8. SCROLL EFFECTS & UI
       ============================================================ */
    function initScrollEffects() {
        const header = $('.header');
        const scrollTopBtn = $('#scrollTopBtn');

        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;

            // Header shadow
            if (header) {
                header.classList.toggle('scrolled', scrollY > 20);
            }

            // Scroll to top button
            if (scrollTopBtn) {
                scrollTopBtn.classList.toggle('visible', scrollY > 600);
            }

            // Intersection observer for fade-in (non-vehicle cards)
            $$('.fade-in:not(.visible)').forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight - 80) {
                    el.classList.add('visible');
                }
            });
        });

        if (scrollTopBtn) {
            scrollTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    /* ---------- Mobile Navigation ---------- */
    function initMobileNav() {
        const toggle = $('#mobileToggle');
        const mobileNav = $('#mobileNav');

        if (toggle && mobileNav) {
            toggle.addEventListener('click', () => {
                mobileNav.classList.toggle('open');
            });

            $$('a', mobileNav).forEach(link => {
                link.addEventListener('click', () => {
                    mobileNav.classList.remove('open');
                });
            });
        }
    }

    /* ============================================================
       9. SMOOTH SCROLL FOR NAV LINKS
       ============================================================ */
    function initSmoothScroll() {
        $$('a[href^="#"]').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72;
                    const y = target.getBoundingClientRect().top + window.scrollY - offset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }
            });
        });
    }

    /* ============================================================
       10. INITIALIZATION
       ============================================================ */
    function init() {
        // Apply saved language
        setLanguage(currentLang);

        // Render default tab
        switchTab('motorbikes');

        // Init UI
        initAutocomplete();
        initClockPicker();
        initScrollEffects();
        initMobileNav();
        initSmoothScroll();

        // Tab click handlers
        $$('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });

        // Language dropdown handlers
        const langBtn = $('#langBtn');
        if (langBtn) langBtn.addEventListener('click', toggleLangDropdown);

        $$('.lang-option').forEach(opt => {
            opt.addEventListener('click', () => setLanguage(opt.dataset.lang));
        });

        // Close lang dropdown on outside click
        document.addEventListener('click', e => {
            if (!e.target.closest('.lang-switcher')) {
                closeLangDropdown();
            }
        });

        // Modal close handlers
        const overlay = $('#bookingOverlay');
        if (overlay) {
            overlay.addEventListener('click', e => {
                if (e.target === overlay) closeBooking();
            });
        }

        const closeBtn = $('#modalCloseBtn');
        if (closeBtn) closeBtn.addEventListener('click', closeBooking);

        // Tour time handlers
        $$('.tour-time-option').forEach(opt => {
            opt.addEventListener('click', () => selectTourTime(opt.dataset.time));
        });

        // Calendar nav
        const prevBtn = $('#calPrev');
        const nextBtn = $('#calNext');
        if (prevBtn) prevBtn.addEventListener('click', prevMonth);
        if (nextBtn) nextBtn.addEventListener('click', nextMonth);

        // Delivery toggle handlers
        $$('.delivery-option').forEach(opt => {
            opt.addEventListener('click', () => {
                selectedDeliveryMethod = opt.dataset.method;
                $$('.delivery-option').forEach(el => {
                    el.classList.toggle('selected', el.dataset.method === selectedDeliveryMethod);
                });
                const deliveryFields = $('#deliveryFields');
                if (deliveryFields) {
                    deliveryFields.style.display = selectedDeliveryMethod === 'delivery' ? 'block' : 'none';
                }
            });
        });

        // Submit buttons
        const waBtn = $('#sendWhatsApp');
        const zaloBtn = $('#sendZalo');
        if (waBtn) waBtn.addEventListener('click', submitWhatsApp);
        if (zaloBtn) zaloBtn.addEventListener('click', submitZalo);

        // Product detail modal handlers
        const productOverlay = $('#productOverlay');
        const productCloseBtn = $('#productCloseBtn');
        if (productCloseBtn) productCloseBtn.addEventListener('click', closeProduct);
        if (productOverlay) {
            productOverlay.addEventListener('click', e => {
                if (e.target === productOverlay) closeProduct();
            });
        }

        // Keyboard: Escape closes modals
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                closeProduct();
                closeBooking();
            }
        });

        console.log('🚀 Mr. Lee Travel — Initialized');
    }

    /* ---------- Public API ---------- */
    window.app = {
        openBooking,
        openProduct,
        selectDate,
        selectHotel,
        adjustDays,
        updateRentalPrice,
        setLanguage
    };

    /* ---------- DOM Ready ---------- */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
