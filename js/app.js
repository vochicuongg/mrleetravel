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
    let selectedTourType = 'private'; // 'private' | 'group'
    const GROUP_PRICE_PER_PERSON = 180000;
    let selectedDeliveryMethod = 'pickup';
    let selectedClockHour = 8;
    let selectedClockMinute = 0;
    let clockUserSelected = false; // true only after user explicitly picks a time

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
        const k = Math.round(price / 1000);
        return new Intl.NumberFormat('vi-VN').format(k) + 'K';
    }

    /**
     * Validates a phone number string.
     * Accepts: digits-only (Vietnamese assumed) or +[country_code][number].
     * Returns { valid: Boolean, message: String|null }
     */
    function validatePhone(raw) {
        const str = raw.trim();
        if (!str) return { valid: false, message: t('toast_phone_required') || 'Vui lòng nhập số điện thoại.' };

        // --- International format: starts with + ---
        if (str.startsWith('+')) {
            const digits = str.slice(1).replace(/\s|-/g, '');
            if (!/^\d+$/.test(digits)) return { valid: false, message: t('toast_phone_invalid') || 'Số điện thoại không hợp lệ.' };

            // Vietnam: +84 + 9 digits
            if (digits.startsWith('84')) {
                const local = digits.slice(2);
                if (local.length !== 9) return { valid: false, message: t('toast_phone_vn_length') || 'Số Việt Nam cần 9 chữ số sau +84.' };
                return { valid: true, message: null };
            }
            // Russia: +7 + 10 digits
            if (digits.startsWith('7')) {
                const local = digits.slice(1);
                if (local.length !== 10) return { valid: false, message: t('toast_phone_invalid') || 'Số Nga (+7) cần 10 chữ số sau mã vùng.' };
                return { valid: true, message: null };
            }
            // China: +86 + 11 digits
            if (digits.startsWith('86')) {
                const local = digits.slice(2);
                if (local.length !== 11) return { valid: false, message: t('toast_phone_invalid') || 'Số Trung Quốc (+86) cần 11 chữ số.' };
                return { valid: true, message: null };
            }
            // South Korea: +82 + 9–11 digits
            if (digits.startsWith('82')) {
                const local = digits.slice(2);
                if (local.length < 9 || local.length > 11) return { valid: false, message: t('toast_phone_invalid') || 'Số Hàn Quốc (+82) cần 9–11 chữ số.' };
                return { valid: true, message: null };
            }
            // Germany: +49 + 10–12 digits
            if (digits.startsWith('49')) {
                const local = digits.slice(2);
                if (local.length < 10 || local.length > 12) return { valid: false, message: t('toast_phone_invalid') || 'Số Đức (+49) cần 10–12 chữ số.' };
                return { valid: true, message: null };
            }
            // Other international: ITU allows 7–15 digits total
            if (digits.length < 7 || digits.length > 15) return { valid: false, message: t('toast_phone_invalid') || 'Số điện thoại quốc tế không hợp lệ.' };
            return { valid: true, message: null };
        }

        // --- Local Vietnamese format: starts with 0, exactly 10 digits ---
        const digitsOnly = str.replace(/\s|-/g, '');
        if (!/^\d+$/.test(digitsOnly)) return { valid: false, message: t('toast_phone_invalid') || 'Chỉ nhập số hoặc định dạng +mã_vùng.' };
        if (!digitsOnly.startsWith('0')) return { valid: false, message: t('toast_phone_vn_zero') || 'Số nội địa Việt Nam phải bắt đầu bằng 0.' };
        if (digitsOnly.length !== 10) return { valid: false, message: t('toast_phone_vn_length10') || 'Số Việt Nam phải đủ 10 chữ số.' };
        return { valid: true, message: null };
    }


    /**
     * Returns 1.25 if `dateToCheck` falls within any holidayRanges entry, else 1.0.
     * @param {Date|null} dateToCheck
     */
    function getHolidayMultiplier(dateToCheck) {
        if (!dateToCheck || !Array.isArray(holidayRanges)) return 1.0;
        // Normalise to midnight local time for clean date comparison
        const d = new Date(dateToCheck);
        d.setHours(0, 0, 0, 0);
        for (const range of holidayRanges) {
            const from = new Date(range.from + 'T00:00:00');
            const to = new Date(range.to + 'T00:00:00');
            if (d >= from && d <= to) return 1.25;
        }
        return 1.0;
    }

    /** Show/hide the holiday surcharge badge above the price summary block. */
    function updateHolidayBadge() {
        let badge = $('#holidaySurchargeBadge');
        if (!badge) {
            // Create once and insert before bookingPriceDisplay
            const priceDisplay = $('#bookingPriceDisplay');
            if (!priceDisplay) return;
            badge = document.createElement('div');
            badge.id = 'holidaySurchargeBadge';
            badge.className = 'holiday-surcharge-badge';
            priceDisplay.parentNode.insertBefore(badge, priceDisplay);
        }
        const multiplier = getHolidayMultiplier(selectedDate);
        if (multiplier > 1.0) {
            const activeRange = holidayRanges.find(r => {
                const d = new Date(selectedDate); d.setHours(0, 0, 0, 0);
                return d >= new Date(r.from + 'T00:00:00') && d <= new Date(r.to + 'T00:00:00');
            });
            badge.textContent = `${t('holiday_surcharge') || '🎉 Phụ phí ngày Lễ +25%'}${activeRange ? ' — ' + activeRange.name : ''}`;
            badge.style.display = '';
        } else {
            badge.style.display = 'none';
        }
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
          <img src="${v.image}" alt="${t(v.nameKey) || v.nameKey}" loading="lazy">
        </div>
        <div class="vehicle-card-body">
          <h3 class="vehicle-card-title">${t(v.nameKey) || v.nameKey}</h3>
          <div class="vehicle-card-features">
            ${v.features.map(f => `<span>${t(f)}</span>`).join('')}
          </div>
          <div class="vehicle-card-footer">
            <div class="vehicle-card-price">
              ${category === 'jeeps'
                ? `<span class="jeep-price-block"><span class="jeep-price-private">${formatPrice(v.price)}<small>/${t('per_tour')}</small></span><span class="jeep-price-sep">·</span><span class="jeep-price-group">180K<small>/${t('people_unit')}</small></span></span>`
                : v.price > 0 ? `${formatPrice(v.price)} <small>/${t(v.priceUnit)}</small>` : `<span class="contact-price">${t('contact_us')}</span>`}
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

        if (img) { img.src = vehicle.image; img.alt = t(vehicle.nameKey) || vehicle.nameKey; }
        if (title) title.textContent = t(vehicle.nameKey) || vehicle.nameKey;
        if (price) {
            price.innerHTML = vehicle.price > 0 ? `${formatPrice(vehicle.price)} <small>/${t(vehicle.priceUnit)}</small>` : `<span class="contact-price">${t('contact_us')}</span>`;
        }
        if (features) {
            features.innerHTML = vehicle.features.map(f => {
                const icon = featureIcons[f] || 'fa-solid fa-check';
                return `<span><i class="${icon}"></i>${t(f)}</span>`;
            }).join('');
        }

        // Gallery thumbnails
        let galleryEl = $('#productGallery');
        if (galleryEl) {
            if (vehicle.gallery && vehicle.gallery.length > 1) {
                galleryEl.innerHTML = vehicle.gallery.map((src, i) =>
                    `<img src="${src}" class="gallery-thumb${i === 0 ? ' active' : ''}" onclick="this.parentNode.querySelectorAll('.gallery-thumb').forEach(t=>t.classList.remove('active')); this.classList.add('active'); document.getElementById('productImg').src=this.src;" alt="Jeep ${i + 1}" loading="lazy">`
                ).join('');
                galleryEl.style.display = 'flex';
            } else {
                galleryEl.style.display = 'none';
            }
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
            let titleKey = 'modal_title_motorbike';

            if (cat === 'jeeps') {
                titleKey = 'modal_title_jeep';
            } else if (cat === 'minibuses') {
                // Check if it's 7-seat (Fortuner) using capacity or feature
                // We set capacity: 7 in vehicleData.js for Fortuner
                if (bookingVehicle.capacity === 7 || (bookingVehicle.features && bookingVehicle.features.includes('feat_7seats'))) {
                    titleKey = 'modal_title_7seat';
                } else {
                    titleKey = 'modal_title_minibus';
                }
            }

            titleEl.textContent = `${t(titleKey)} — ${t(bookingVehicle.nameKey) || bookingVehicle.nameKey}`;
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

        // Hide clock picker initially (shown when date is selected, except for Jeeps)
        const clockPicker = $('#clockPicker');
        if (clockPicker) {
            clockPicker.style.display = 'none';
        }

        // Reset form
        selectedDate = null;
        selectedTourTime = null;
        selectedTourType = 'private';
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
            el.onclick = () => {
                $$('.delivery-option').forEach(b => b.classList.remove('selected'));
                el.classList.add('selected');
                toggleDeliveryFields(el.dataset.method);
            };
        });
        switchClockMode('hour');
        $('#bookingNotes').value = '';

        // Live phone input: allow only digits, +, spaces, hyphens; strip the rest
        const phoneEl = $('#bookingPhone');
        if (phoneEl && !phoneEl._phoneSanitizerAttached) {
            phoneEl._phoneSanitizerAttached = true;
            phoneEl.addEventListener('input', () => {
                const cur = phoneEl.value;
                // Allow: digits, +, space, hyphen. + only valid at start.
                let sanitized = cur.replace(/[^\d\s\-+]/g, '');
                // Force + only at position 0
                sanitized = sanitized.replace(/(?!^)\+/g, '');
                if (sanitized !== cur) phoneEl.value = sanitized;
                phoneEl.classList.remove('input-error');
            });
        }


        // Show/hide rental duration & promo (Motorbikes only)
        const rentalGroup = $('#rentalDurationGroup');
        const promoBanner = $('#promoBanner');
        const deliveryMethodGroup = $('#deliveryMethodGroup');
        const tripInfoBox = $('#tripInfoBox');

        // Address Groups
        const pickupGroup = $('#pickupGroup');
        const dropoffGroup = $('#dropoffGroup');
        const flightGroup = $('#flightGroup');
        const pickupLabel = $('#pickupLabel');

        // Reset visibility
        if (rentalGroup) rentalGroup.style.display = 'none';
        if (promoBanner) promoBanner.style.display = 'none';
        if (deliveryMethodGroup) deliveryMethodGroup.style.display = 'none';
        if (tripInfoBox) tripInfoBox.style.display = 'none';
        if (pickupGroup) pickupGroup.style.display = 'none';
        if (dropoffGroup) dropoffGroup.style.display = 'none';
        if (flightGroup) flightGroup.style.display = 'none';

        // Always hide jeep-only sections first
        const jeepTourTypeGroup = $('#jeepTourTypeGroup');
        if (jeepTourTypeGroup) jeepTourTypeGroup.style.display = 'none';
        const groupPeopleGroup = $('#groupPeopleGroup');
        if (groupPeopleGroup) groupPeopleGroup.style.display = 'none';
        const tourTimeWrapper = $('#tourTimeWrapper');
        if (tourTimeWrapper) tourTimeWrapper.style.display = 'none';
        $('#tourTimeSelector')?.classList.remove('visible');

        // LOGIC PER CATEGORY
        if (bookingVehicle._category === 'motorbikes') {
            // MOTORBIKE
            if (deliveryMethodGroup) {
                deliveryMethodGroup.style.display = '';
                // Trigger logic to show/hide pickup address based on toggle
                const selectedMethod = $('.delivery-option.selected')?.dataset.method || 'pickup';
                toggleDeliveryFields(selectedMethod);
            }
            if (rentalGroup) {
                rentalGroup.style.display = '';
                const daysInput = $('#rentalDays');
                if (daysInput) daysInput.value = 1;
                updateRentalPrice();
            }
            if (promoBanner) renderPromoBanner();

        } else if (bookingVehicle._category === 'jeeps') {
            // JEEP
            if (tripInfoBox) {
                tripInfoBox.style.display = 'block';
                $('#routeDisplay').innerHTML = '';
                $('#itineraryDisplay').innerHTML = '';
            }
            if (deliveryFields) deliveryFields.style.display = 'block';
            if (pickupGroup) {
                pickupGroup.style.display = 'block';
                if (pickupLabel) pickupLabel.textContent = t('label_pickup_address');
            }
            // Show tour type selector & reset to Private
            const tourTypeGroup = $('#jeepTourTypeGroup');
            if (tourTypeGroup) tourTypeGroup.style.display = 'block';
            if (tourTimeWrapper) tourTimeWrapper.style.display = 'block';
            $('#tourTimeSelector')?.classList.add('visible');
            selectTourType('private');

        } else if (bookingVehicle._category === 'minibuses') {
            // MINIBUS
            if (tripInfoBox) tripInfoBox.style.display = 'block';
            $('#itineraryDisplay').innerHTML = '';

            const capacity = bookingVehicle.features.find(f => f.includes('seats')) || '';
            const is16Seat = capacity.includes('16');

            const pickupOptions = `
                <option value="" disabled selected>${t('placeholder_choose_pickup') || 'Chọn điểm đón...'}</option>
                <option value="Mũi Né">Mũi Né</option>
                <option value="Sân bay Tân Sơn Nhất (SGN)">Sân bay Tân Sơn Nhất (SGN)</option>
                <option value="Nha Trang">Nha Trang</option>
                <option value="Biển Phan Rang">${t('stop_phan_rang') || 'Biển Phan Rang'}</option>
            `;
            const dropoffOptions = `
                <option value="" disabled selected>${t('placeholder_choose_dropoff') || 'Chọn điểm trả...'}</option>
                <option value="Mũi Né">Mũi Né</option>
                <option value="Sân bay Tân Sơn Nhất (SGN)">Sân bay Tân Sơn Nhất (SGN)</option>
                <option value="Nha Trang">Nha Trang</option>
                <option value="Biển Phan Rang">${t('stop_phan_rang') || 'Biển Phan Rang'}</option>
                <option value="Tà Cú (Không bao gồm phí cáp treo)">${t('dropoff_ta_cu') || 'Tà Cú (Không bao gồm phí cáp treo)'}</option>
                <option value="Xương Cá Ông">${t('dropoff_xuong_ca_ong') || 'Xương Cá Ông'}</option>
                <option value="Chùa Cổ Thạch">${t('dropoff_chua_co_thach') || 'Chùa Cổ Thạch'}</option>
            `;

            $('#routeDisplay').innerHTML = `
                <div class="route-field">
                    <label class="route-label">${t('label_pickup_address') || 'Điểm đón'}</label>
                    <select class="form-control" id="pickupSelect">${pickupOptions}</select>
                </div>
                <div class="route-swap-row">
                    <button type="button" class="route-swap-btn" id="swapRouteBtn" title="Hoán đổi điểm">⇅</button>
                </div>
                <div class="route-field">
                    <label class="route-label">${t('label_dropoff_address') || 'Điểm trả'}</label>
                    <select class="form-control" id="dropoffSelect">${dropoffOptions}</select>
                </div>
                <div id="routeSummaryBox" style="display:none;margin-top:12px"></div>
                <div id="routeHotelFields" style="display:none;margin-top:14px">
                    <div class="form-group" style="margin-bottom:12px">
                        <label class="route-label">T\u00ean Kh\u00e1ch s\u1ea1n/Resort</label>
                        <div class="autocomplete-wrapper">
                            <input type="text" class="form-control" id="routeDeliveryName"
                                placeholder="Nh\u1eadp t\u00ean kh\u00e1ch s\u1ea1n/Resort" autocomplete="off">
                            <div class="autocomplete-list" id="routeHotelAC"></div>
                        </div>
                        <div id="routeOtherHotelWrap" style="display:none;margin-top:8px">
                            <input type="text" class="form-control" id="routeOtherHotelName"
                                placeholder="Nh\u1eadp t\u00ean kh\u00e1ch s\u1ea1n c\u1ee7a b\u1ea1n..." autocomplete="off"
                                style="border-color:#e8a000;">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="route-label">${t('label_delivery_address') || 'Địa Chỉ Khách Sạn/Resort'}</label>
                        <div class="autocomplete-wrapper">
                            <input type="text" class="form-control" id="routeDeliveryAddress"
                                placeholder="Nh\u1eadp \u0111\u1ecba ch\u1ec9 kh\u00e1ch s\u1ea1n/Resort" autocomplete="off">
                            <div class="autocomplete-list" id="routeAddressAC"></div>
                        </div>
                    </div>
                </div>
            `;

            const ROUTE_STOPS = {
                'Mũi Né→Sân bay Tân Sơn Nhất (SGN)': [t('stop_muine'), t('stop_sgn')],
                'Mũi Né→Nha Trang': [t('stop_muine'), t('stop_nhatrang')],
                'Mũi Né→Biển Phan Rang': [t('stop_muine'), t('stop_phan_rang')],
                'Mũi Né→Tà Cú (Không bao gồm phí cáp treo)': [t('stop_muine'), t('stop_thap_cham'), t('stop_xuong_ca_ong'), t('stop_ta_cu'), t('stop_muine')],
                'Mũi Né→Xương Cá Ông': [t('stop_muine'), t('stop_thap_cham'), t('stop_xuong_ca_ong'), t('stop_muine')],
                'Mũi Né→Chùa Cổ Thạch': [t('stop_muine'), t('stop_chua_co_thach'), t('stop_muine')],
                'Sân bay Tân Sơn Nhất (SGN)→Mũi Né': [t('stop_sgn'), t('stop_muine')],
                'Sân bay Tân Sơn Nhất (SGN)→Nha Trang': [t('stop_sgn'), t('stop_nhatrang')],
                'Sân bay Tân Sơn Nhất (SGN)→Biển Phan Rang': [t('stop_sgn'), t('stop_phan_rang')],
                'Nha Trang→Mũi Né': [t('stop_nhatrang'), t('stop_muine')],
                'Nha Trang→Sân bay Tân Sơn Nhất (SGN)': [t('stop_nhatrang'), t('stop_sgn')],
                'Biển Phan Rang→Mũi Né': [t('stop_phan_rang'), t('stop_muine')],
                'Biển Phan Rang→Sân bay Tân Sơn Nhất (SGN)': [t('stop_phan_rang'), t('stop_sgn')],
            };
            const BASE_PRICE = bookingVehicle.price || 1690000;
            const ROUTE_PRICES = is16Seat ? {
                'Mũi Né→Biển Phan Rang': 2600000,
                'Biển Phan Rang→Mũi Né': 2600000,
                'Sân bay Tân Sơn Nhất (SGN)→Biển Phan Rang': 5200000,
                'Biển Phan Rang→Sân bay Tân Sơn Nhất (SGN)': 5200000,
                'Mũi Né→Tà Cú (Không bao gồm phí cáp treo)': 1900000,
                'Mũi Né→Xương Cá Ông': 1900000,
                'Mũi Né→Chùa Cổ Thạch': 2700000,
                'Sân bay Tân Sơn Nhất (SGN)→Nha Trang': 5200000,
                'Nha Trang→Sân bay Tân Sơn Nhất (SGN)': 5200000,
            } : {
                'Mũi Né→Biển Phan Rang': 1690000,
                'Biển Phan Rang→Mũi Né': 1690000,
                'Sân bay Tân Sơn Nhất (SGN)→Biển Phan Rang': 3380000,
                'Biển Phan Rang→Sân bay Tân Sơn Nhất (SGN)': 3380000,
                'Mũi Né→Chùa Cổ Thạch': 1900000,
                'Sân bay Tân Sơn Nhất (SGN)→Nha Trang': 3380000,
                'Nha Trang→Sân bay Tân Sơn Nhất (SGN)': 3380000,
            };

            const pickupSel = $('#pickupSelect');
            const dropoffSel = $('#dropoffSelect');
            const routeSummaryBox = $('#routeSummaryBox');

            function renderRouteSummary() {
                const pickup = pickupSel ? pickupSel.value : '';
                const dropoff = dropoffSel ? dropoffSel.value : '';
                if (!pickup || !dropoff) { if (routeSummaryBox) routeSummaryBox.style.display = 'none'; return; }
                const routeKey = pickup + '→' + dropoff;
                const stops = ROUTE_STOPS[routeKey];
                if (!stops) { routeSummaryBox.style.display = 'none'; return; }
                routeSummaryBox.style.display = 'block';
                const last = stops.length - 1;
                const isRoundTrip = stops[0] === stops[last];
                const tripPrice = ROUTE_PRICES[routeKey] ?? BASE_PRICE;
                routeSummaryBox.innerHTML = `
                    <div class="route-summary">
                        ${stops.map((s, i) => {
                    let cls = 'route-stop';
                    if (i === 0) cls += ' route-stop--start';
                    else if (i === last) cls += ' route-stop--return';
                    else if (isRoundTrip && i === last - 1) cls += ' route-stop--dest';
                    else cls += ' route-stop--mid';
                    return `<span class="${cls}">${s}</span>${i < last ? '<span class="route-arrow">→</span>' : ''}`;
                }).join('')}
                    </div>
                    <div class="route-price-badge">
                        <i class="fa-solid fa-tag"></i>
                        ${formatPrice(tripPrice)} <small>/ ${t('per_trip') || 'chuyến'}</small>
                    </div>`;
            }

            function updateHotelVisibility(pickup) {
                const isAirport = pickup === 'Sân bay Tân Sơn Nhất (SGN)';
                const rh = $('#routeHotelFields');
                const orig = $('#deliveryFields');
                if (orig) orig.style.display = 'none';
                if (rh) rh.style.display = isAirport ? 'none' : 'block';
            }

            let prevPickupVal = '';
            let prevDropoffVal = '';
            const tourOnly = ['Tà Cú (Không bao gồm phí cáp treo)', 'Xương Cá Ông', 'Chùa Cổ Thạch'];

            function filterDropoff() {
                if (!pickupSel || !dropoffSel) return;
                const newPickup = pickupSel.value;
                const isAirport = newPickup === 'Sân bay Tân Sơn Nhất (SGN)';
                const isNhaTrang = newPickup === 'Nha Trang';
                Array.from(dropoffSel.options).forEach(opt => {
                    const restricted = (isAirport || isNhaTrang) && tourOnly.includes(opt.value);
                    opt.hidden = restricted; opt.disabled = restricted;
                });
                if (dropoffSel.value === newPickup) {
                    const cand = prevPickupVal;
                    const canSet = cand && cand !== newPickup &&
                        !Array.from(dropoffSel.options).find(o => o.value === cand && o.hidden);
                    dropoffSel.value = canSet ? cand : '';
                }
                const cur = dropoffSel.options[dropoffSel.selectedIndex];
                if (cur && cur.hidden) dropoffSel.value = '';
                updateHotelVisibility(newPickup);
                prevPickupVal = newPickup;
            }

            function filterPickup() {
                if (!pickupSel || !dropoffSel) return;
                const newDropoff = dropoffSel.value;
                if (pickupSel.value === newDropoff) {
                    const cand = prevDropoffVal;
                    const pv = Array.from(pickupSel.options).map(o => o.value);
                    pickupSel.value = (cand && pv.includes(cand) && cand !== newDropoff) ? cand : '';
                    filterDropoff();
                }
                prevDropoffVal = newDropoff;
            }

            function swapPickupDropoff() {
                if (!pickupSel || !dropoffSel) return;
                const op = pickupSel.value, od = dropoffSel.value;
                if (!op || !od) return;
                const pv = Array.from(pickupSel.options).map(o => o.value);
                if (!pv.includes(od)) { showToast('Không thể hoán đổi — điểm trả không phải điểm đón hợp lệ!'); return; }
                Array.from(dropoffSel.options).forEach(o => { o.hidden = false; o.disabled = false; });
                pickupSel.value = od; dropoffSel.value = op;
                prevPickupVal = od; prevDropoffVal = op;
                filterDropoff(); renderRouteSummary(); updateBookingPrice();
                const btn = $('#swapRouteBtn');
                if (btn) { btn.classList.add('spinning'); setTimeout(() => btn.classList.remove('spinning'), 400); }
            }

            const swapBtn = $('#swapRouteBtn');
            if (swapBtn) swapBtn.addEventListener('click', swapPickupDropoff);
            if (pickupSel) pickupSel.addEventListener('change', () => {
                filterDropoff();
                renderRouteSummary();
                updateBookingPrice();
            });
            if (dropoffSel) {
                dropoffSel.addEventListener('change', () => { filterPickup(); renderRouteSummary(); updateBookingPrice(); });
                if (dropoffSel.value) renderRouteSummary();
            }
            if (deliveryFields) deliveryFields.style.display = 'none';
            if (pickupGroup) pickupGroup.style.display = 'none';

            // Wire up hotel autocomplete — getter resolves list dynamically by pickup
            const routeHotelGetter = () => {
                const pv = pickupSel ? pickupSel.value : '';
                if (pv === 'Nha Trang') return nhaTrangHotelList;
                if (pv === 'Biển Phan Rang') return phanRangHotelList;
                return hotelList;
            };
            setupHotelAutocomplete('#routeDeliveryName', '#routeHotelAC', 'name', routeHotelGetter);
            setupHotelAutocomplete('#routeDeliveryAddress', '#routeAddressAC', 'both', routeHotelGetter);
        }

        // Reset state on each booking open
        selectedDate = null;
        clockUserSelected = false;

        // Open modal
        const overlay = $('#bookingOverlay');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';

        // Render calendar
        renderCalendar();

        // Display price summary
        updateBookingPrice();
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

        // Update Itinerary Display (Jeep)
        const itinDisplay = $('#itineraryDisplay');
        const tripInfoBox = $('#tripInfoBox');

        if (time === 'custom') {
            // No longer used
            return;
        } else {
            // Show route summary for sunrise/sunset using pill breadcrumb UI
            if (tripInfoBox) tripInfoBox.style.display = 'block';
            if (itinDisplay) {
                const JEEP_ROUTES = {
                    sunrise: [
                        { label: t('stop_hotel'), cls: 'route-stop route-stop--start' },
                        { label: t('stop_whitedunes'), cls: 'route-stop route-stop--dest' },
                        { label: t('stop_reddunes'), cls: 'route-stop route-stop--dest' },
                        { label: t('stop_fishingvillage'), cls: 'route-stop route-stop--dest' },
                        { label: t('stop_fairystream'), cls: 'route-stop route-stop--dest' },
                        { label: t('stop_hotel'), cls: 'route-stop route-stop--return' },
                    ],
                    sunset: [
                        { label: t('stop_hotel'), cls: 'route-stop route-stop--start' },
                        { label: t('stop_fairystream'), cls: 'route-stop route-stop--dest' },
                        { label: t('stop_fishingvillage'), cls: 'route-stop route-stop--dest' },
                        { label: t('stop_whitedunes'), cls: 'route-stop route-stop--dest' },
                        { label: t('stop_reddunes'), cls: 'route-stop route-stop--dest' },
                        { label: t('stop_hotel'), cls: 'route-stop route-stop--return' },
                    ],
                };
                const stops = JEEP_ROUTES[time];
                if (stops) {
                    const timeLabel = time === 'sunrise' ? t('time_sunrise') : t('time_sunset');
                    itinDisplay.innerHTML = `
                        <div class="route-time-label">${timeLabel}</div>
                        <div class="route-summary">
                            ${stops.map((s, i) =>
                        `<span class="${s.cls}">${s.label}</span>${i < stops.length - 1 ? '<span class="route-arrow">→</span>' : ''}`
                    ).join('')}
                        </div>`;
                }
            }
        }
    }


    function toggleDeliveryFields(method) {
        const deliveryFields = $('#deliveryFields');
        const pickupGroup = $('#pickupGroup');
        const pickupLabel = $('#pickupLabel');

        if (!deliveryFields) return;

        if (method === 'delivery') {
            deliveryFields.style.display = 'block';
            if (pickupGroup) pickupGroup.style.display = 'block';
            if (pickupLabel) pickupLabel.textContent = t('label_delivery_address');
        } else {
            deliveryFields.style.display = 'none';
        }
    }

    /* -------- Tour Type (Jeep) -------- */
    function selectTourType(type) {
        selectedTourType = type;
        $$('.tour-type-option').forEach(el => {
            el.classList.toggle('selected', el.dataset.type === type);
        });
        const groupPeople = $('#groupPeopleGroup');
        if (groupPeople) groupPeople.style.display = type === 'group' ? 'block' : 'none';
        updateBookingPrice();
    }

    function adjustPeople(delta) {
        const input = $('#groupPeopleCount');
        if (!input) return;
        let val = (parseInt(input.value) || 1) + delta;
        if (val < 1) val = 1;
        if (val > 20) val = 20;
        input.value = val;
        updateBookingPrice();
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

        // If today is selected, auto-advance hour to next available
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selDay = new Date(selectedDate);
        selDay.setHours(0, 0, 0, 0);

        if (selDay.getTime() === today.getTime()) {
            const currentHour = now.getHours();
            if (selectedClockHour < currentHour) {
                const hourValues = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
                const nextValid = hourValues.find(h => h > currentHour);
                if (nextValid !== undefined) {
                    selectedClockHour = nextValid;
                }
            }
        }

        // Re-render clock to update disabled state
        renderClockFace();
        updateClockHand();
        updateReturnDate();
        // Recalculate price with holiday multiplier whenever date changes
        updateRentalPrice();

        // Show clock picker when date is selected (not for Jeeps - they use tour time)
        const clockPicker = $('#clockPicker');
        if (clockPicker && bookingVehicle && bookingVehicle._category !== 'jeeps') {
            clockPicker.style.display = '';
        }
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
            `<span class="promo-price">${t('promo_from')} ${it.days} ${t('days_unit')}: <strong>${formatPrice(it.price)}/${t('per_day')}</strong></span>` +
            `<span class="promo-save">${t('promo_save')} ${formatPrice(basePrice - it.price)}/${t('per_day')}</span>` +
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

        const hm = getHolidayMultiplier(selectedDate);
        const originalPrice = bookingVehicle.price;
        const discountPrice = getDiscountedPrice(bookingVehicle, days);
        const surcharged = Math.round(discountPrice * hm);
        const total = surcharged * days;

        if (discountPrice < originalPrice) {
            display.innerHTML =
                `<div class="rental-discount-badge">🎉 ${t('discount_label')}</div>` +
                `<div class="rental-price-line">` +
                `<span class="rental-price-original">${formatPrice(originalPrice)}</span> → ` +
                `<span class="rental-price-new">${formatPrice(surcharged)}/${t('per_day')}</span>` +
                `</div>` +
                `<div class="rental-total">${t('total_label')}: <strong>${formatPrice(total)}</strong> (${days} ${t('days_unit')})</div>`;
        } else {
            display.innerHTML =
                `<div class="rental-price-line">${formatPrice(surcharged)}/${t('per_day')}</div>` +
                `<div class="rental-total">${t('total_label')}: <strong>${formatPrice(total)}</strong> (${days} ${t('days_unit')})</div>`;
        }

        // Also update the booking price summary
        updateBookingPrice();
        updateReturnDate();
    }


    function updateReturnDate() {
        const display = $('#returnDateDisplay');
        const group = $('#returnDateGroup');
        const input = $('#returnDateInput');
        if (!selectedDate || !bookingVehicle || bookingVehicle._category !== 'motorbikes') {
            if (display) display.innerHTML = '';
            if (group) group.style.display = 'none';
            return;
        }
        const daysInput = $('#rentalDays');
        const days = parseInt(daysInput ? daysInput.value : 1) || 1;
        const returnDate = new Date(selectedDate);
        returnDate.setDate(returnDate.getDate() + days);
        const returnStr = `${returnDate.getDate()}/${returnDate.getMonth() + 1}/${returnDate.getFullYear()}`;
        if (display) display.innerHTML = '';
        if (group) group.style.display = '';
        if (input) input.value = returnStr;
    }

    function updateBookingPrice() {
        const display = $('#bookingPriceDisplay');
        if (!display || !bookingVehicle) return;

        const category = bookingVehicle._category;
        const hm = getHolidayMultiplier(selectedDate);
        const isHoliday = hm > 1.0;
        const holidayNoteLine = isHoliday
            ? `<div class="price-holiday-note">${t('holiday_surcharge') || 'Phụ phí ngày Lễ'}</div>`
            : '';
        let priceHtml = '';

        if (category === 'motorbikes') {
            const daysInput = $('#rentalDays');
            let days = parseInt(daysInput ? daysInput.value : 1) || 1;
            const discountPrice = getDiscountedPrice(bookingVehicle, days);
            const surcharged = Math.round(discountPrice * hm);
            const total = surcharged * days;
            const detailLine = isHoliday
                ? `${formatPrice(discountPrice)} + 25% × ${days} ${t('days_unit')}`
                : `${formatPrice(discountPrice)} × ${days} ${t('days_unit')}`;
            priceHtml = `
                <div class="price-summary-label">${t('total_label')}</div>
                <div class="price-summary-amount">${formatPrice(total)}</div>
                <div class="price-summary-detail">${detailLine}</div>
                ${holidayNoteLine}
            `;
        } else if (category === 'jeeps') {
            if (selectedTourType === 'group') {
                const people = parseInt($('#groupPeopleCount')?.value || 2) || 2;
                const basePPP = GROUP_PRICE_PER_PERSON;
                const surchargedPPP = Math.round(basePPP * hm);
                const total = people * surchargedPPP;
                const detailLine = isHoliday
                    ? `${formatPrice(basePPP)} + 25% × ${people} ${t('people_unit')}`
                    : `${formatPrice(basePPP)} × ${people} ${t('people_unit')}`;
                priceHtml = `
                    <div class="price-summary-label">${t('total_label')}</div>
                    <div class="price-summary-amount">${formatPrice(total)}</div>
                    <div class="price-summary-detail">${detailLine}</div>
                    ${holidayNoteLine}
                `;
            } else {
                const basePrice = bookingVehicle.price;
                const surchargedPrice = Math.round(basePrice * hm);
                const detailLine = isHoliday
                    ? `${formatPrice(basePrice)} + 25% / ${t('per_tour')}`
                    : t('per_tour');
                priceHtml = `
                    <div class="price-summary-label">${t('total_label')}</div>
                    <div class="price-summary-amount">${formatPrice(surchargedPrice)}</div>
                    <div class="price-summary-detail">${detailLine}</div>
                    ${holidayNoteLine}
                `;
            }
        } else if (category === 'minibuses') {
            const mbP = $('#pickupSelect'), mbD = $('#dropoffSelect');
            const mbRK = (mbP ? mbP.value : '') + '→' + (mbD ? mbD.value : '');
            const mbC = bookingVehicle.features ? (bookingVehicle.features.find(f => f.includes('seats')) || '') : '';
            const mbPx = mbC.includes('16') ? {
                'Mũi Né→Biển Phan Rang': 2600000,
                'Biển Phan Rang→Mũi Né': 2600000,
                'Sân bay Tân Sơn Nhất (SGN)→Biển Phan Rang': 5200000,
                'Biển Phan Rang→Sân bay Tân Sơn Nhất (SGN)': 5200000,
                'Mũi Né→Tà Cú (Không bao gồm phí cáp treo)': 1900000,
                'Mũi Né→Xương Cá Ông': 1900000,
                'Mũi Né→Chùa Cổ Thạch': 2700000,
                'Sân bay Tân Sơn Nhất (SGN)→Nha Trang': 5200000,
                'Nha Trang→Sân bay Tân Sơn Nhất (SGN)': 5200000,
            } : {
                'Mũi Né→Biển Phan Rang': 1690000,
                'Biển Phan Rang→Mũi Né': 1690000,
                'Sân bay Tân Sơn Nhất (SGN)→Biển Phan Rang': 3380000,
                'Biển Phan Rang→Sân bay Tân Sơn Nhất (SGN)': 3380000,
                'Mũi Né→Chùa Cổ Thạch': 1900000,
                'Sân bay Tân Sơn Nhất (SGN)→Nha Trang': 3380000,
                'Nha Trang→Sân bay Tân Sơn Nhất (SGN)': 3380000,
            };
            const baseTrip = mbPx[mbRK] ?? bookingVehicle.price;
            const surchargedTrip = Math.round(baseTrip * hm);
            const detailLine = isHoliday
                ? `${formatPrice(baseTrip)} + 25% / ${t('per_trip')}`
                : t('per_trip');
            priceHtml = `
                <div class="price-summary-label">${t('total_label')}</div>
                <div class="price-summary-amount">${formatPrice(surchargedTrip)}</div>
                <div class="price-summary-detail">${detailLine}</div>
                ${holidayNoteLine}
            `;
        }

        display.innerHTML = priceHtml;
        updateHolidayBadge();
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

        let lastDragDist = 80; // remember last drag distance to determine ring

        function getAngleFromEvent(e) {
            const rect = svg.getBoundingClientRect();
            const touch = e.touches ? e.touches[0] : e;
            const x = touch.clientX - rect.left - rect.width / 2;
            const y = touch.clientY - rect.top - rect.height / 2;
            // Scale from px to SVG units (viewBox 200x200)
            const svgScale = 100 / (rect.width / 2);
            lastDragDist = Math.sqrt(x * x + y * y) * svgScale;
            let angle = Math.atan2(y, x) * 180 / Math.PI + 90;
            if (angle < 0) angle += 360;
            return angle;
        }

        function snapValue(angle) {
            if (clockMode === 'hour') {
                const isMoto = bookingVehicle && bookingVehicle._category === 'motorbikes';
                if (isMoto) {
                    // 16 positions (6-21), each 22.5 degrees
                    const hourValues = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
                    let idx = Math.round(angle / 22.5) % 16;
                    if (idx < 0) idx += 16;
                    return hourValues[idx];
                } else {
                    // Two-ring: outer (r>55) = 00-11, inner (r<=55) = 12-23, each 30 degrees
                    let idx = Math.round(angle / 30) % 12;
                    if (idx < 0) idx += 12;
                    return lastDragDist > 55 ? idx : idx + 12;
                }
            } else {
                // 12 positions (0,5,10...55), each 30 degrees
                let idx = Math.round(angle / 30);
                if (idx >= 12) idx = 0;
                return idx * 5;
            }
        }

        function onDragStart(e) {
            // Hit-test: only drag if touch starts inside the clock circle (r ≤ 85 SVG units).
            // Corners of the rectangular SVG are outside the circle and should scroll normally.
            getAngleFromEvent(e); // populates lastDragDist
            if (lastDragDist > 85) return; // outside circle → let scroll happen

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
                // Block dragging to a past hour when today is selected
                if (selectedDate) {
                    const now = new Date();
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const selDay = new Date(selectedDate);
                    selDay.setHours(0, 0, 0, 0);
                    if (selDay.getTime() === today.getTime() && val < now.getHours()) {
                        return;
                    }
                }
                selectedClockHour = val;
            } else {
                // Block dragging to a past minute when today + current hour is selected
                if (selectedDate) {
                    const now = new Date();
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const selDay = new Date(selectedDate);
                    selDay.setHours(0, 0, 0, 0);
                    if (selDay.getTime() === today.getTime() && selectedClockHour === now.getHours() && val <= now.getMinutes()) {
                        return;
                    }
                }
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
                const isMoto = bookingVehicle && bookingVehicle._category === 'motorbikes';
                if (isMoto && selectedClockHour === 21) {
                    // Motorbike last hour — skip minutes, lock at :00
                    selectedClockMinute = 0;
                    clockUserSelected = true;
                    setTimeout(() => showClockConfirmation(), 250);
                } else {
                    setTimeout(() => switchClockMode('minute'), 250);
                }
            }
            // Show confirmation when minute drag ends
            if (wasDragging && clockMode === 'minute') {
                showClockConfirmation();
            }
        }

        // Mouse events
        svg.addEventListener('mousedown', onDragStart);
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);

        // Touch events — bound to svg so scroll works outside the clock circle.
        // Browser guarantees touchmove/touchend for a pointer are always delivered
        // to the element where touchstart fired, even if the finger moves outside.
        svg.addEventListener('touchstart', onDragStart, { passive: false });
        svg.addEventListener('touchmove', onDragMove, { passive: false });
        svg.addEventListener('touchend', onDragEnd);

        // Click on number to select
        const numbersG = $('#clockNumbers');
        if (numbersG) {
            numbersG.addEventListener('click', e => {
                const num = e.target.closest('.clock-number');
                if (!num) return;
                if (num.dataset.disabled === 'true') return;
                const val = parseInt(num.dataset.value);
                if (clockMode === 'hour') {
                    selectedClockHour = val;
                    updateClockHand();
                    const isMoto = bookingVehicle && bookingVehicle._category === 'motorbikes';
                    if (isMoto && val === 21) {
                        // Motorbike last hour — skip minute selection, lock at :00
                        selectedClockMinute = 0;
                        updateClockHand();
                        clockUserSelected = true;
                        setTimeout(() => showClockConfirmation(), 250);
                    } else {
                        setTimeout(() => switchClockMode('minute'), 250);
                    }
                } else {
                    selectedClockMinute = val;
                    updateClockHand();
                    showClockConfirmation();
                }
            });
        }

        // Display click handlers to switch mode
        const hourDisplay = $('#clockHourDisplay');
        const minDisplay = $('#clockMinDisplay');
        if (hourDisplay) hourDisplay.addEventListener('click', () => switchClockMode('hour'));
        if (minDisplay) minDisplay.addEventListener('click', () => {
            // Block switching to minute mode when hour=21 on motorbike form
            const isMoto = bookingVehicle && bookingVehicle._category === 'motorbikes';
            if (isMoto && selectedClockHour === 21) return;
            switchClockMode('minute');
        });
    }

    function showClockConfirmation() {
        clockUserSelected = true; // User has explicitly chosen a time
        const display = $('.clock-display');
        if (!display) return;

        // Add confirmed class for green flash
        display.classList.add('clock-confirmed');

        // Show checkmark badge
        let badge = display.querySelector('.clock-check-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'clock-check-badge';
            badge.textContent = '✓';
            display.appendChild(badge);
        }
        badge.classList.add('show');

        // Remove after animation
        setTimeout(() => {
            display.classList.remove('clock-confirmed');
            badge.classList.remove('show');
        }, 1500);
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
            const isMoto = bookingVehicle && bookingVehicle._category === 'motorbikes';

            // Determine which hours are past (disabled) when today is selected
            let disabledUpTo = -1;
            if (selectedDate) {
                const now = new Date();
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const selDay = new Date(selectedDate);
                selDay.setHours(0, 0, 0, 0);
                if (selDay.getTime() === today.getTime()) {
                    disabledUpTo = now.getHours();
                }
            }

            if (isMoto) {
                // Motorbike: 16 numbers (6-21) at 22.5° on single ring
                const hourValues = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
                for (let i = 0; i < 16; i++) {
                    const h = hourValues[i];
                    const isPast = h < disabledUpTo;
                    const angle = (i * 22.5 - 90) * Math.PI / 180;
                    const x = cx + 66 * Math.cos(angle);
                    const y = cy + 66 * Math.sin(angle);
                    const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    txt.setAttribute('x', x); txt.setAttribute('y', y);
                    txt.setAttribute('class', 'clock-number' + (isPast ? ' disabled' : ''));
                    txt.setAttribute('data-value', h);
                    if (isPast) txt.setAttribute('data-disabled', 'true');
                    txt.textContent = h;
                    numbersG.appendChild(txt);
                }
            } else {
                // Transfer: two-ring layout — outer (r=66): 00-11, inner (r=44): 12-23
                // Both use standard 12-position clock (30° each)
                for (let i = 0; i < 12; i++) {
                    const angle = (i * 30 - 90) * Math.PI / 180;

                    // Outer ring: 00-11
                    const hOut = i; // 0..11
                    const isPastOut = hOut < disabledUpTo;
                    const xOut = cx + 66 * Math.cos(angle);
                    const yOut = cy + 66 * Math.sin(angle);
                    const txtOut = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    txtOut.setAttribute('x', xOut); txtOut.setAttribute('y', yOut);
                    txtOut.setAttribute('class', 'clock-number clock-number-outer' + (isPastOut ? ' disabled' : ''));
                    txtOut.setAttribute('data-value', hOut);
                    if (isPastOut) txtOut.setAttribute('data-disabled', 'true');
                    txtOut.textContent = String(hOut).padStart(2, '0');
                    numbersG.appendChild(txtOut);

                    // Inner ring: 12-23
                    const hIn = i + 12; // 12..23
                    const isPastIn = hIn < disabledUpTo;
                    const xIn = cx + 44 * Math.cos(angle);
                    const yIn = cy + 44 * Math.sin(angle);
                    const txtIn = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    txtIn.setAttribute('x', xIn); txtIn.setAttribute('y', yIn);
                    txtIn.setAttribute('class', 'clock-number clock-number-inner' + (isPastIn ? ' disabled' : ''));
                    txtIn.setAttribute('data-value', hIn);
                    if (isPastIn) txtIn.setAttribute('data-disabled', 'true');
                    txtIn.textContent = String(hIn).padStart(2, '0');
                    numbersG.appendChild(txtIn);
                }
            }
        } else {
            // 12 minute labels: 05, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 00
            const minuteValues = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 0];

            // Determine which minutes are past when today + current hour is selected
            let disabledUpToMin = -1;
            if (selectedDate) {
                const now = new Date();
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const selDay = new Date(selectedDate);
                selDay.setHours(0, 0, 0, 0);
                if (selDay.getTime() === today.getTime() && selectedClockHour === now.getHours()) {
                    disabledUpToMin = now.getMinutes();
                }
            }

            for (let i = 0; i < 12; i++) {
                const val = minuteValues[i];
                const isPast = disabledUpToMin >= 0 && val <= disabledUpToMin && val !== 0 || (disabledUpToMin >= 0 && val === 0 && disabledUpToMin >= 55);
                const angle = ((i + 1) * 30 - 90) * Math.PI / 180;
                const x = cx + numR * Math.cos(angle);
                const y = cy + numR * Math.sin(angle);
                const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                txt.setAttribute('x', x);
                txt.setAttribute('y', y);
                txt.setAttribute('class', 'clock-number' + (isPast ? ' disabled' : ''));
                txt.setAttribute('data-value', val);
                if (isPast) txt.setAttribute('data-disabled', 'true');
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

        const cx = 100, cy = 100;
        let angleDeg;
        let handR = 70; // default (motorbike / minute mode)

        if (clockMode === 'hour') {
            const isMoto = bookingVehicle && bookingVehicle._category === 'motorbikes';
            if (isMoto) {
                const hourValues = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
                const idx = hourValues.indexOf(selectedClockHour);
                angleDeg = idx >= 0 ? idx * 22.5 : 0;
            } else {
                // Two-ring: outer (0-11) at r=66, inner (12-23) at r=44
                angleDeg = (selectedClockHour % 12) * 30;
                // Hand length matches the ring the selected hour lives on
                handR = selectedClockHour >= 12 ? 44 : 66;
            }
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
        // Hotel Name autocomplete (static delivery fields for non-minibus vehicles)
        setupHotelAutocomplete('#deliveryName', '#hotelAutocomplete', 'name');
        // Address autocomplete
        setupHotelAutocomplete('#deliveryAddress', '#addressAutocomplete', 'both');
    }

    function setupHotelAutocomplete(inputSel, listSel, searchBy, hotelData) {
        // hotelData can be an array or a getter function (called at event time)
        const getList = typeof hotelData === 'function' ? hotelData : () => (hotelData || hotelList);
        const input = $(inputSel);
        const list = $(listSel);
        if (!input || !list) return;

        function renderList(matches) {
            if (matches.length === 0) { list.classList.remove('open'); return; }
            list.innerHTML = matches.map(h => `
                <div class="autocomplete-item">
                    <div class="autocomplete-name">${h.name}</div>
                    <div class="autocomplete-address">${h.address}</div>
                </div>`).join('');

            list.querySelectorAll('.autocomplete-item').forEach((item, i) => {
                item.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    selectHotelItem(matches[i], inputSel, listSel);
                });
            });
            list.classList.add('open');
        }

        input.addEventListener('focus', () => {
            const data = getList();
            const val = input.value.toLowerCase().trim();
            if (val.length < 2) { renderList(data); return; }
            renderList(data.filter(h => h.name.toLowerCase().includes(val)));
        });

        input.addEventListener('input', () => {
            const data = getList();
            const val = input.value.toLowerCase().trim();
            if (val.length < 2) { renderList(data); return; }
            const matches = data.filter(h => {
                if (searchBy === 'both') return h.name.toLowerCase().includes(val) || h.address.toLowerCase().includes(val);
                return h.name.toLowerCase().includes(val);
            });
            renderList(matches);
        });

        input.addEventListener('blur', () => {
            setTimeout(() => list.classList.remove('open'), 300);
        });
    }

    function selectHotel(index) {
        const hotel = hotelList[index];
        if (!hotel) return;
        // Prefer route hotel fields if visible, else fall back to static delivery fields
        const routeNameInput = $('#routeDeliveryName');
        const routeAddrInput = $('#routeDeliveryAddress');
        const nameInput = routeNameInput || $('#deliveryName');
        const addrInput = routeAddrInput || $('#deliveryAddress');
        if (hotel._isOther) {
            if (nameInput) { nameInput.value = ''; nameInput.focus(); }
            if (addrInput) addrInput.value = '';
        } else {
            if (nameInput) nameInput.value = hotel.name;
            if (addrInput) addrInput.value = hotel.address;
        }
        const list1 = $('#routeHotelAC') || $('#hotelAutocomplete');
        const list2 = $('#routeAddressAC') || $('#addressAutocomplete');
        if (list1) list1.classList.remove('open');
        if (list2) list2.classList.remove('open');
    }

    function selectHotelItem(hotel, inputSel, listSel) {
        if (!hotel) return;
        const isRouteField = inputSel === '#routeDeliveryName' || inputSel === '#routeDeliveryAddress';
        const nameInput = isRouteField ? $('#routeDeliveryName') : $('#deliveryName');
        const addrInput = isRouteField ? $('#routeDeliveryAddress') : $('#deliveryAddress');
        const otherWrap = isRouteField ? $('#routeOtherHotelWrap') : null;
        const otherInput = isRouteField ? $('#routeOtherHotelName') : null;

        if (hotel._isOther) {
            // Show extra input for custom hotel name
            if (nameInput) nameInput.value = 'Khách sạn khác';
            if (addrInput) addrInput.value = '';
            if (otherWrap) otherWrap.style.display = 'block';
            if (otherInput) { otherInput.value = ''; setTimeout(() => otherInput.focus(), 50); }
        } else {
            // Normal hotel selected — hide custom input
            if (otherWrap) otherWrap.style.display = 'none';
            if (otherInput) otherInput.value = '';
            if (nameInput) nameInput.value = hotel.name;
            if (addrInput) addrInput.value = hotel.address;
        }
        const acList = $(listSel);
        if (acList) acList.classList.remove('open');
    }

    /* ============================================================
       6. FORM SUBMISSION (WhatsApp / Zalo / Telegram + CF Worker)
       ============================================================ */
    function getBookingData() {
        const name = $('#bookingName').value.trim();
        const phone = $('#bookingPhone').value.trim();
        const clockTime = `${String(selectedClockHour).padStart(2, '0')}:${String(selectedClockMinute).padStart(2, '0')}`;
        const notes = $('#bookingNotes').value.trim();

        if (!name) {
            showToast(t('toast_error') || 'Vui lòng điền đầy đủ thông tin.');
            $('#bookingName').focus();
            return null;
        }
        const phoneCheck = validatePhone(phone);
        if (!phoneCheck.valid) {
            showToast(phoneCheck.message);
            const phoneEl = $('#bookingPhone');
            if (phoneEl) {
                phoneEl.classList.add('input-error');
                phoneEl.focus();
                setTimeout(() => phoneEl.classList.remove('input-error'), 2500);
            }
            return null;
        }


        // Validate: date must be selected on the calendar
        if (!selectedDate) {
            showToast(t('toast_select_date') || 'Vui lòng chọn ngày trên lịch!');
            // Scroll calendar into view
            const cal = $('#bookingCalendar');
            if (cal) cal.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return null;
        }

        // Validate: clock time must be chosen (motorbikes & minibuses — jeep uses tour-time selector)
        const needsClock = bookingVehicle && (bookingVehicle._category === 'motorbikes' || bookingVehicle._category === 'minibuses');
        if (needsClock && !clockUserSelected) {
            showToast(t('toast_select_time') || 'Vui lòng chọn giờ trên đồng hồ!');
            const clockEl = $('.clock-picker');
            if (clockEl) clockEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return null;
        }

        // Validate: Jeep must have tour time selected
        if (bookingVehicle && bookingVehicle._category === 'jeeps' && !selectedTourTime) {
            showToast(t('toast_select_tour_time') || 'Vui lòng chọn mốc thời gian!');
            return null;
        }

        // Validate: minibus must have both pickup AND dropoff selected
        if (bookingVehicle && bookingVehicle._category === 'minibuses') {
            const mbPc = $('#pickupSelect'), mbDc = $('#dropoffSelect');
            if (mbPc && !mbPc.value) {
                showToast(t('toast_select_pickup') || 'Vui lòng chọn điểm đón!');
                return null;
            }
            if (mbDc && !mbDc.value) {
                showToast(t('toast_select_dropoff') || 'Vui lòng chọn điểm trả!');
                return null;
            }
            // Validate: hotel name required when pickup is NOT the airport
            const mbPickup = mbPc ? mbPc.value : '';
            const AIRPORT = 'Sân bay Tân Sơn Nhất (SGN)';
            if (mbPickup && mbPickup !== AIRPORT) {
                const _otherWrapV = $('#routeOtherHotelWrap');
                const _otherInputV = $('#routeOtherHotelName');
                const _routeNameV = $('#routeDeliveryName');
                const customNameV = (_otherWrapV && _otherWrapV.style.display !== 'none' && _otherInputV) ? _otherInputV.value.trim() : '';
                const hotelNameV = customNameV || (_routeNameV ? _routeNameV.value.trim() : '');
                if (!hotelNameV) {
                    showToast(t('toast_hotel_required') || 'Vui lòng nhập Tên Khách Sạn/Resort!');
                    if (_routeNameV) _routeNameV.focus();
                    return null;
                }
            }
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
        const _hm = getHolidayMultiplier(selectedDate);
        const _hmSuffix = _hm > 1.0 ? ` [${t('holiday_surcharge') || 'Phụ phí Lễ +25%'}]` : '';
        let rentalDays = 1;
        let returnDateStr = '';
        let priceStr = bookingVehicle ? `${formatPrice(Math.round(bookingVehicle.price * _hm))}` : '';
        if (bookingVehicle && bookingVehicle._category === 'motorbikes') {
            const daysInput = $('#rentalDays');
            rentalDays = parseInt(daysInput ? daysInput.value : 1) || 1;
            const discounted = getDiscountedPrice(bookingVehicle, rentalDays);
            const surcharged = Math.round(discounted * _hm);
            const total = surcharged * rentalDays;
            priceStr = discounted < bookingVehicle.price
                ? `${formatPrice(surcharged)}/${t('per_day')} × ${rentalDays} ${t('days_unit')} = ${formatPrice(total)} (${t('discount_label')}${_hmSuffix})`
                : `${formatPrice(surcharged)}/${t('per_day')} × ${rentalDays} ${t('days_unit')} = ${formatPrice(total)}${_hmSuffix}`;
            if (selectedDate) {
                const returnDate = new Date(selectedDate);
                returnDate.setDate(returnDate.getDate() + rentalDays);
                returnDateStr = `${returnDate.getDate()}/${returnDate.getMonth() + 1}/${returnDate.getFullYear()}`;
            }
        }

        // Minibus pricing: pickup→dropoff combined route key
        if (bookingVehicle && bookingVehicle._category === 'minibuses') {
            const mbP4 = $('#pickupSelect'), mbD4 = $('#dropoffSelect');
            const mbRK4 = (mbP4 ? mbP4.value : '') + '→' + (mbD4 ? mbD4.value : '');
            const mbC4 = bookingVehicle.features ? (bookingVehicle.features.find(f => f.includes('seats')) || '') : '';
            const mbPx4 = mbC4.includes('16') ? {
                'Mũi Né→Biển Phan Rang': 2600000,
                'Biển Phan Rang→Mũi Né': 2600000,
                'Sân bay Tân Sơn Nhất (SGN)→Biển Phan Rang': 5200000,
                'Biển Phan Rang→Sân bay Tân Sơn Nhất (SGN)': 5200000,
                'Mũi Né→Tà Cú (Không bao gồm phí cáp treo)': 1900000,
                'Mũi Né→Xương Cá Ông': 1900000,
                'Mũi Né→Chùa Cổ Thạch': 2700000,
                'Sân bay Tân Sơn Nhất (SGN)→Nha Trang': 5200000,
                'Nha Trang→Sân bay Tân Sơn Nhất (SGN)': 5200000,
            } : {
                'Mũi Né→Biển Phan Rang': 1690000,
                'Biển Phan Rang→Mũi Né': 1690000,
                'Sân bay Tân Sơn Nhất (SGN)→Biển Phan Rang': 3380000,
                'Biển Phan Rang→Sân bay Tân Sơn Nhất (SGN)': 3380000,
                'Mũi Né→Chùa Cổ Thạch': 1900000,
                'Sân bay Tân Sơn Nhất (SGN)→Nha Trang': 3380000,
                'Nha Trang→Sân bay Tân Sơn Nhất (SGN)': 3380000,
            };
            const mbBase = mbPx4[mbRK4] ?? bookingVehicle.price;
            priceStr = `${formatPrice(Math.round(mbBase * _hm))}/${t('per_trip')}${_hmSuffix}`;
        }

        // Jeep pricing: depends on tour type
        let tourTypeLabel = '';
        let peopleCount = 0;
        if (bookingVehicle && bookingVehicle._category === 'jeeps') {
            const peopleInput = $('#groupPeopleCount');
            peopleCount = parseInt(peopleInput ? peopleInput.value : 1) || 1;
            if (selectedTourType === 'group') {
                const surchargedPPP = Math.round(180000 * _hm);
                tourTypeLabel = t('tour_type_group') || 'Tour Ghép';
                priceStr = `${formatPrice(peopleCount * surchargedPPP)} (${formatPrice(surchargedPPP)} × ${peopleCount} ${t('people_unit') || 'người'})${_hmSuffix}`;
            } else {
                tourTypeLabel = t('tour_type_private') || 'Tour riêng tư';
                priceStr = `${formatPrice(Math.round(bookingVehicle.price * _hm))}${_hmSuffix}`;
            }
        }

        // Hotel/address info (route fields for minibus, static fields for others)
        const _otherWrap = $('#routeOtherHotelWrap');
        const _otherInput = $('#routeOtherHotelName');
        const _routeName = $('#routeDeliveryName');
        const _routeAddr = $('#routeDeliveryAddress');
        // If "Khách sạn khác" is active, use the custom typed name; else use the route delivery field
        const _customName = (_otherWrap && _otherWrap.style.display !== 'none' && _otherInput) ? _otherInput.value.trim() : '';
        const hotelName = _customName || (_routeName ? _routeName.value.trim() : '') || ($('#deliveryName') ? $('#deliveryName').value.trim() : '');
        const hotelAddress = (_routeAddr ? _routeAddr.value.trim() : '') || ($('#deliveryAddress') ? $('#deliveryAddress').value.trim() : '');

        // Route info (minibuses)
        let routeInfo = '';
        if (bookingVehicle && bookingVehicle._category === 'minibuses') {
            const pickupSelect = $('#pickupSelect');
            const dropoffSelect = $('#dropoffSelect');
            const pickup = pickupSelect ? pickupSelect.value : '';
            const dropoff = dropoffSelect ? dropoffSelect.value : '';
            if (pickup && dropoff) {
                routeInfo = `${pickup} \u27a1 ${dropoff}`;
            }
        }


        // Dropoff & flight (minibuses)
        const dropoffAddress = $('#dropoffAddress') ? $('#dropoffAddress').value.trim() : '';
        const flightNumber = $('#flightNumber') ? $('#flightNumber').value.trim() : '';

        return {
            vehicle: bookingVehicle ? (t(bookingVehicle.nameKey) || bookingVehicle.nameKey) : '',
            category: bookingVehicle ? bookingVehicle._category : '',
            name,
            phone,
            delivery: deliveryInfo,
            date: dateStr,
            returnDate: returnDateStr,
            time: bookingVehicle && bookingVehicle._category === 'jeeps' && selectedTourTime
                ? (selectedTourTime === 'sunrise' ? '04:30 🌅' : '13:30 🌇') : clockTime,
            timeDisplay: bookingVehicle && bookingVehicle._category === 'jeeps' && selectedTourTime
                ? `${t('tour_' + selectedTourTime + '_display') || (selectedTourTime === 'sunrise' ? 'Bình minh' : 'Hoàng hôn')} - ${selectedTourTime === 'sunrise' ? '04:30' : '13:30'}`
                : null,
            notes,
            price: priceStr,
            rentalDays,
            hotelName,
            hotelAddress,
            routeInfo,
            dropoffAddress,
            flightNumber,
            tourType: tourTypeLabel,
            peopleCount
        };
    }

    function buildMessage(data) {
        if (data.category === 'jeeps') {
            const pickupAddr = [data.hotelName, data.hotelAddress].filter(Boolean).join(' — ') || '';
            const tourTypeLine = data.tourType ? `* *${t('label_tour_type') || 'Loại Tour'}:* ${data.tourType}${data.peopleCount > 1 ? ` (${data.peopleCount} ${t('people_unit') || 'người'})` : ''}` : '';
            return [
                t('msg_greeting_jeep') || 'Xin chào Mr. Lee, tôi muốn đặt tour Jeep và đây là thông tin của tôi:',
                `* *${t('msg_name')}:* ${data.name}`,
                `* *${t('msg_phone')}:* ${data.phone}`,
                `* *${t('msg_vehicle_jeep') || 'Mẫu Xe'}:* ${data.vehicle}`,
                tourTypeLine,
                `* *${t('msg_date_jeep') || 'Ngày đón'}:* ${data.date}`,
                `* *${t('msg_time_jeep') || 'Giờ đón'}:* ${data.timeDisplay || data.time}`,
                pickupAddr ? `* *${t('msg_pickup_address') || 'Địa chỉ đón'}:* ${pickupAddr}` : '',
                data.notes ? `* *${t('msg_notes')}:* ${data.notes}` : ''
            ].filter(Boolean).join('\n');
        }

        if (data.category === 'minibuses') {
            // Minibus customer message
            const isAirportPickup = data.routeInfo && data.routeInfo.startsWith('Sân bay Tân Sơn Nhất (SGN)');
            return [
                t('msg_greeting_minibus') || 'Xin chào Mr. Lee, tôi muốn đặt xe transfer và đây là thông tin của tôi:',
                `* *${t('msg_name')}:* ${data.name}`,
                `* *${t('msg_phone')}:* ${data.phone}`,
                `* *${t('msg_vehicle')}:* ${data.vehicle}`,
                data.routeInfo ? `* *${t('msg_route') || 'Lộ trình'}:* ${data.routeInfo}` : '',
                !isAirportPickup && data.hotelName ? `* *${t('msg_hotel_name') || 'Tên Khách sạn/Resort'}:* ${data.hotelName}` : '',
                !isAirportPickup && data.hotelAddress ? `* *${t('msg_hotel_address') || 'Địa chỉ'}:* ${data.hotelAddress}` : '',
                `* *${t('msg_date')}:* ${data.date}`,
                `* *${t('msg_time')}:* ${data.time}`,
                data.notes ? `* *${t('msg_notes')}:* ${data.notes}` : ''
            ].filter(Boolean).join('\n');
        }

        // Default (motorbikes)
        return [
            t('msg_greeting'),
            `- *${t('msg_name')}:* ${data.name}`,
            `- *${t('msg_phone')}:* ${data.phone}`,
            `- *${t('msg_vehicle')}:* ${data.vehicle}`,
            `- *${t('msg_date')}:* ${data.date}`,
            `- *${t('msg_time')}:* ${data.time}`,
            `- *${t('msg_delivery')}:* ${data.delivery}`,
            data.notes ? `- *${t('msg_notes')}:* ${data.notes}` : ''
        ].filter(Boolean).join('\n');
    }

    function submitWhatsApp() {
        const data = getBookingData();
        if (!data) return;
        const msg = encodeURIComponent(buildMessage(data));
        window.open(`https://api.whatsapp.com/send/?phone=84913690974&text=${msg}&type=phone_number&app_absent=0`, '_blank');
        sendToTelegram(data);
        closeBooking();
        showToast(t('toast_success'));
    }

    function submitZalo() {
        const data = getBookingData();
        if (!data) return;
        const rawMsg = buildMessage(data);
        // Zalo doesn't support pre-filled URL text — copy to clipboard instead
        navigator.clipboard.writeText(rawMsg).then(() => {
            sendToTelegram(data);
            closeBooking();
            showToast(t('toast_zalo_copied') || '📋 Tin nhắn đã được sao chép! Mở Zalo và dán để gửi.');
            setTimeout(() => window.open(`https://zalo.me/84338311432`, '_blank'), 800);
        }).catch(() => {
            // Fallback if clipboard API unavailable
            sendToTelegram(data);
            closeBooking();
            window.open(`https://zalo.me/84338311432`, '_blank');
        });
    }

    /* --- Telegram Bot Direct API --- */
    async function sendToTelegram(data) {
        const BOT_TOKEN = '8312475945:AAGJDDqCG-UV-pxTT7Wfx4UAD4A591IvJBY';
        const CHAT_ID = '-1003849920066';

        const now = new Date();
        const timestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        let message;

        if (data.category === 'jeeps') {
            const pickupAddress = [data.hotelName, data.hotelAddress].filter(Boolean).join(' — ') || 'Chưa cung cấp';
            const tourTypeLine = data.tourType
                ? `🎫 <b>Loại Tour:</b> ${data.tourType}${data.peopleCount > 1 ? ` (${data.peopleCount} ${t('people_unit') || 'người'})` : ''}`
                : '';
            message = [
                `🚀 <b>ĐƠN ĐẶT JEEP TOUR</b>`,
                `---------------------`,
                `👤 <b>Tên KH:</b> ${data.name}`,
                `📱 <b>SĐT:</b> ${data.phone}`,
                `🚗 <b>Mẫu xe:</b> ${data.vehicle}`,
                tourTypeLine,
                `💰 <b>Giá tiền:</b> ${data.price}`,
                `📅 <b>Ngày đón khách:</b> ${data.date}`,
                `⏰ <b>Giờ đón khách:</b> ${data.time}`,
                `🚚 <b>Địa chỉ đón khách:</b> ${pickupAddress}`,
                data.notes ? `📝 <b>Ghi chú:</b> ${data.notes}` : '',
                `---------------------`,
                `🕐 <b>Thời gian tạo đơn:</b> ${timestamp}`
            ].filter(Boolean).join('\n');
        } else if (data.category === 'minibuses') {
            // Minibus/Transfer format
            const isAirportPickup = data.routeInfo && data.routeInfo.startsWith('Sân bay Tân Sơn Nhất (SGN)');
            const pickupAddr = !isAirportPickup
                ? ([data.hotelName, data.hotelAddress].filter(Boolean).join(' — ') || 'Chưa cung cấp')
                : null;
            message = [
                `🚀 <b>ĐƠN ĐẶT XE TRANSFER</b>`,
                `---------------------`,
                `👤 <b>Tên KH:</b> ${data.name}`,
                `📱 <b>SĐT:</b> ${data.phone}`,
                `🚗 <b>Loại xe:</b> ${data.vehicle}`,
                `💰 <b>Giá tiền:</b> ${data.price}`,
                data.routeInfo ? `🗺️ <b>Lộ trình:</b> ${data.routeInfo}` : '',
                `📅 <b>Ngày đón:</b> ${data.date}`,
                `⏰ <b>Giờ đón:</b> ${data.time}`,
                pickupAddr ? `📍 <b>Điểm đón:</b> ${pickupAddr}` : '',
                data.notes ? `📝 <b>Ghi chú:</b> ${data.notes}` : '',
                `---------------------`,
                `🕐 <b>Thời gian tạo đơn:</b> ${timestamp}`
            ].filter(Boolean).join('\n');
        } else {
            // Default format (motorbikes, minibuses)
            message = [
                `🚀 <b>ĐƠN ĐẶT XE MÁY</b>`,
                `---------------------`,
                `👤 <b>Tên KH:</b> ${data.name}`,
                `📱 <b>SĐT:</b> ${data.phone}`,
                `🚗 <b>Tên Xe:</b> ${data.vehicle}`,
                `💰 <b>Giá tiền:</b> ${data.price}`,
                `📅 <b>Ngày nhận xe:</b> ${data.date}`,
                `⏰ <b>Giờ nhận xe:</b> ${data.time}`,
                data.returnDate ? `📆 <b>Ngày trả xe:</b> ${data.returnDate}` : '',
                `🚚 <b>Hình thức nhận xe:</b> ${data.delivery}`,
                data.notes ? `📝 <b>Ghi chú:</b> ${data.notes}` : '',
                `---------------------`,
                `🕐 <b>Thời gian tạo đơn:</b> ${timestamp}`
            ].filter(Boolean).join('\n');
        }

        try {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: message,
                    parse_mode: 'HTML'
                })
            });
        } catch (err) {
            console.warn('Telegram notification failed:', err);
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
        setLanguage,
        selectTourType,
        adjustPeople,
        updateBookingPrice
    };

    /* ---------- DOM Ready ---------- */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
