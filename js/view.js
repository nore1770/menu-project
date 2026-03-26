const I18N_DICT = {
    title: "Grand Hotel",
    navStart: "Start",
    navMenu: "Menu",
    navCart: "Cart",
    lblTrending: "Trending & Recommendations",
    catAll: "All",
    lblSpecial: "Today's Special",
    lblStarters: "Starters",
    lblLightCourses: "Light Courses",
    lblMain: "Main Courses",
    lblDesserts: "Desserts",
    lblBeverages: "Beverages",
    lblSetMeals: "Set Meals",
    callService: "🛎️",
    srvReqTitle: "Service Request",
    srvReqText: "Do you require assistance from our staff?",
    btnCancel: "Cancel",
    btnCall: "Call Waiter",
    toastSrv: "Waitstaff is on the way!",
    toastAdd: "added to cart",
    emptyCart: "Your cart is empty.",
    lblTip: "Add Tip:",
    lblTotal: "Total:",
    btnCheckout: "Proceed to Checkout",
    vegetarian: "Vegetarian",
    vegan: "Vegan",
    onions: "Contains Onions",
    "gluten-free": "Gluten-Free",
    "lactose-free": "Lactose-Free",
    "non-alcoholic": "Non-Alcoholic",
    alcoholic: "Alcoholic"
};

/**
 * VIEW
 * Manages the DOM, translations, dragging, and modals
 */
class AppView {
    constructor() {
        this.initServiceModal();
        this.initDishModal();
    }

    getTranslation(key, lang) {
        return I18N_DICT[key] || key;
    }

    translatePage(lang) {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (el.tagName === 'INPUT' && el.type === 'button') {
                el.value = this.getTranslation(key, lang);
            } else {
                el.innerText = this.getTranslation(key, lang);
            }
        });

        const pageTitle = document.querySelector('header.page-title, header.title');
        if (pageTitle) pageTitle.innerText = this.getTranslation('title', lang);
        document.body.className = `lang-${lang}`;
    }

    initServiceModal() {
        if (document.getElementById('serviceModalOverlay')) return;
        const modalHtml = `
            <div class="service-modal-overlay" id="serviceModalOverlay">
                <div class="service-modal">
                    <div class="service-modal-header">
                        <h3 data-i18n="srvReqTitle">Service Request</h3>
                        <span class="service-icon">🛎️</span>
                    </div>
                    <p class="service-modal-text" data-i18n="srvReqText">Do you require assistance from our staff?</p>
                    <div class="service-modal-actions">
                        <button class="btn-cancel" id="btnCancelService" data-i18n="btnCancel">Cancel</button>
                        <button class="btn-confirm" id="btnConfirmService" data-i18n="btnCall">Call Waiter</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    initDishModal() {
        if(document.getElementById('dishModalOverlay')) return;
        const modalHtml = `
            <div class="dish-modal-overlay" id="dishModalOverlay">
                <div class="dish-modal" id="dishModalContainer">
                    <!-- Dynamic content injected here -->
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    openDishModal(dish, lang) {
        const overlay = document.getElementById('dishModalOverlay');
        const container = document.getElementById('dishModalContainer');
        if(!overlay || !container) return;

        let constraintsHtml = '';
        if (dish.dietary && Array.isArray(dish.dietary)) {
            constraintsHtml = '<div class="constraints-bar" style="margin-bottom:0;">';
            dish.dietary.forEach(c => {
                const cTitle = this.getTranslation(c, lang);
                let icon = 'ℹ️';
                if (c === 'vegan') icon = '🌱';
                if (c === 'vegetarian') icon = '🥗';
                if (c === 'gluten-free') icon = '🌾';
                if (c === 'lactose-free') icon = '🥛';
                if (c === 'alcoholic') icon = '🍷';
                if (c === 'non-alcoholic') icon = '🧃';
                if (c === 'onions') icon = '🧅';
                constraintsHtml += `<span class="badge" title="${cTitle}">${icon} ${cTitle}</span>`;
            });
            constraintsHtml += '</div>';
        }

        const priceStr = String(dish.price).includes('€') ? dish.price : `${dish.price}€`;
        const ingStr = dish.ingredients ? dish.ingredients.join(', ') : '';

        let imageHtml = '';
        if (dish.image) {
            imageHtml = `<img src="${dish.image}" class="dish-modal-img" alt="${dish.name}" onerror="this.style.display='none'">`;
        } else {
            imageHtml = `<div class="dish-modal-img" style="background: linear-gradient(45deg, #f0ece1, #e3ded1);"></div>`;
        }

        container.innerHTML = `
            <button class="dish-modal-close" id="btnDishModalClose">×</button>
            ${imageHtml}
            <div class="dish-modal-content">
                <div class="dish-modal-header">
                    <h2 class="dish-modal-title">${dish.name}</h2>
                    <div class="dish-modal-price">${priceStr}</div>
                </div>
                ${constraintsHtml}
                <div class="dish-modal-desc" style="font-weight: 600; color: var(--text-main); font-size: 1.1rem; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 12px;">${dish.description}</div>
                ${dish.story ? `<div class="dish-modal-story" style="font-size: 1.05rem; color: #555; line-height: 1.6; margin-top: 15px;">${dish.story}</div>` : ''}
                ${ingStr ? `<div class="dish-modal-ing" style="margin-top: 5px;"><strong>Ingredients:</strong><br/>${ingStr}</div>` : ''}
                <button class="dish-modal-add-btn" id="btnDishModalAdd" data-dish='${JSON.stringify(dish).replace(/'/g, "&apos;")}'>
                    Add to Cart
                </button>
            </div>
        `;
        overlay.classList.add('active');
    }

    closeDishModal() {
        const overlay = document.getElementById('dishModalOverlay');
        if(overlay) overlay.classList.remove('active');
    }

    renderHomeData(menuDataArray, lang) {
        const trendingContainer = document.getElementById('trending-container');
        if (trendingContainer && Array.isArray(menuDataArray)) {
            trendingContainer.innerHTML = '';
            const trendingItems = menuDataArray.filter(dish => dish.category === 'starters').slice(0, 3);
            trendingItems.forEach(dish => trendingContainer.appendChild(this.createCard(dish, lang)));
        }

        const specialContainer = document.getElementById('special-container');
        if (specialContainer && Array.isArray(menuDataArray)) {
            specialContainer.innerHTML = '';
            const specialItems = menuDataArray.filter(dish => dish.isSpecial === true);
            specialItems.forEach(dish => specialContainer.appendChild(this.createCard(dish, lang)));
        }

        const setmealsContainer = document.getElementById('setmeals-container');
        if (setmealsContainer && Array.isArray(menuDataArray)) {
            setmealsContainer.innerHTML = '';
            const setmealsItems = menuDataArray.filter(dish => dish.category === 'setMeals');
            setmealsItems.forEach(dish => setmealsContainer.appendChild(this.createCard(dish, lang)));
        }
    }

    renderMenuCategories(lang, activeCategory) {
        const container = document.getElementById('menu-categories');
        if (!container) return;

        const categories = [
            { id: 'all', key: 'catAll' },
            { id: 'setMeals', key: 'lblSetMeals' },
            { id: 'starters', key: 'lblStarters' },
            { id: 'lightCourses', key: 'lblLightCourses' },
            { id: 'main', key: 'lblMain' },
            { id: 'desserts', key: 'lblDesserts' },
            { id: 'beverages', key: 'lblBeverages' }
        ];

        container.innerHTML = categories.map(cat => `
            <div class="category-tab ${activeCategory === cat.id ? 'active' : ''}" data-category="${cat.id}">
                ${this.getTranslation(cat.key, lang)}
            </div>
        `).join('');
    }

    renderMenuFilters(lang, activeCategory, activeFilters) {
        const container = document.getElementById('menu-filters');
        if (!container) return;

        let availableFilters = [];
        if (activeCategory === 'beverages') {
            availableFilters = ['alcoholic', 'non-alcoholic'];
        } else if (activeCategory === 'desserts') {
            availableFilters = ['vegan', 'lactose-free', 'gluten-free'];
        } else if (activeCategory === 'all') {
            availableFilters = ['vegan', 'vegetarian', 'lactose-free', 'gluten-free', 'onions', 'alcoholic', 'non-alcoholic'];
        } else {
            availableFilters = ['vegan', 'vegetarian', 'lactose-free', 'gluten-free', 'onions'];
        }

        container.innerHTML = availableFilters.map(f => {
            const isActive = activeFilters.includes(f) ? 'active' : '';
            return `<div class="filter-chip ${isActive}" data-filter="${f}">${this.getTranslation(f, lang)}</div>`;
        }).join('');
    }

    createCard(dish, lang) {
        const card = document.createElement("div");
        card.className = "card draggable-card";
        card.setAttribute("draggable", "true");
        card.setAttribute("data-dish", JSON.stringify(dish));

        let constraintsHtml = '';
        if (dish.dietary && Array.isArray(dish.dietary)) {
            constraintsHtml = '<div class="constraints-bar">';
            dish.dietary.forEach(c => {
                const cTitle = this.getTranslation(c, lang);
                let icon = 'ℹ️';
                if (c === 'vegan') icon = '🌱';
                if (c === 'vegetarian') icon = '🥗';
                if (c === 'gluten-free') icon = '🌾';
                if (c === 'lactose-free') icon = '🥛';
                if (c === 'alcoholic') icon = '🍷';
                if (c === 'non-alcoholic') icon = '🧃';
                if (c === 'onions') icon = '🧅';
                constraintsHtml += `<span class="badge" title="${cTitle}">${icon} ${cTitle}</span>`;
            });
            constraintsHtml += '</div>';
        }

        let ingredientsHtml = '';
        if (dish.ingredients && Array.isArray(dish.ingredients)) {
            ingredientsHtml = `<div class="ingredients-list"><em>${dish.ingredients.join(', ')}</em></div>`;
        }

        let imageHtml = '';
        if (dish.image) {
            // Include an empty box or image tag for the aesthetic if image links naturally fail
            imageHtml = `<div class="card-image-placeholder" style="background-image: url('${dish.image}'), linear-gradient(45deg, #f0ece1, #e3ded1);"></div>`;
        }

        let originHtml = '';
        if (dish.origin) {
            originHtml = `<div class="origin-tag" style="font-size: 0.8rem; color: var(--text-muted); font-style: italic; margin-bottom: 8px;">📍 Origin: ${dish.origin}</div>`;
        }

        const priceStr = String(dish.price).includes('€') ? dish.price : `${dish.price}€`;

        card.innerHTML = `
            ${imageHtml}
            <h3>${dish.name}</h3>
            <p>${dish.description}</p>
            ${ingredientsHtml}
            ${constraintsHtml}
            ${originHtml}
            <div class="price">${priceStr}</div>
            <button class="add-button" data-dish='${JSON.stringify(dish).replace(/'/g, "&apos;")}'>+</button>
        `;
        return card;
    }

    renderMenu(menuDataArray, lang, category, activeFilters) {
        const container = document.getElementById('menu-sections-container');
        if (!container) return;
        container.innerHTML = '';
        if (!Array.isArray(menuDataArray)) return;

        const sections = [
            { id: 'setMeals', i18nKey: 'lblSetMeals' },
            { id: 'starters', i18nKey: 'lblStarters' },
            { id: 'lightCourses', i18nKey: 'lblLightCourses' },
            { id: 'main', i18nKey: 'lblMain' },
            { id: 'desserts', i18nKey: 'lblDesserts' },
            { id: 'beverages', i18nKey: 'lblBeverages' }
        ];

        let targetSections = category === 'all' ? sections : sections.filter(s => s.id === category);

        targetSections.forEach(sec => {
            // Find items for this section
            let items = menuDataArray.filter(dish => dish.category === sec.id);

            // Apply filtering logic
            if (activeFilters.length > 0) {
                items = items.filter(dish => {
                    const dishDietary = dish.dietary || [];
                    return activeFilters.every(filter => dishDietary.includes(filter));
                });
            }

            if (items.length === 0) return;

            const sectionEl = document.createElement('section');
            sectionEl.className = 'menu-section';

            const header = document.createElement('h2');
            header.setAttribute('data-i18n', sec.i18nKey);
            header.innerText = this.getTranslation(sec.i18nKey, lang);
            sectionEl.appendChild(header);

            const row = document.createElement('div');
            row.className = 'scroll-row';
            row.style.flexWrap = 'wrap';

            items.forEach(dish => {
                row.appendChild(this.createCard(dish, lang));
            });

            sectionEl.appendChild(row);
            container.appendChild(sectionEl);
        });
    }

    renderCart(cartData, totalPrice, tipRate, lang) {
        const cartContainer = document.getElementById('cart-content');
        const tipContainer = document.getElementById('cart-tip-container');

        if (!cartContainer) return;
        cartContainer.innerHTML = '';

        if (cartData.length === 0) {
            cartContainer.innerHTML = `<div class="empty-cart-message" data-i18n="emptyCart">${this.getTranslation('emptyCart', lang)}</div>`;
            if (tipContainer) tipContainer.style.display = 'none';
            document.getElementById('cart-total-container').style.display = 'none';
            document.getElementById('checkout-btn').style.display = 'none';
            return;
        }

        cartData.forEach((item, index) => {
            const priceStr = String(item.price).includes('€') ? item.price : `${item.price}€`;
            const q = item.quantity || 1;
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            itemEl.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>Unit Price: ${priceStr}</p>
                </div>
                <div class="cart-item-quantity">
                    <button class="qty-btn qty-minus" data-index="${index}">-</button>
                    <span class="qty-val">${q}</span>
                    <button class="qty-btn qty-plus" data-index="${index}">+</button>
                </div>
                <div class="cart-item-price">${(parseFloat(item.price) * q).toFixed(2)}€</div>
                <button class="add-button remove-btn" data-index="${index}" style="position:static; width:30px; height:30px; line-height:30px; font-size:16px;">×</button>
            `;
            cartContainer.appendChild(itemEl);
        });

        if (tipContainer) {
            tipContainer.style.display = 'flex';
            document.getElementById('tip-select').value = tipRate;
        }

        const tipAmount = totalPrice * tipRate;
        const finalPrice = totalPrice + tipAmount;

        document.getElementById('cart-total-container').style.display = 'flex';
        document.getElementById('cart-total-price').innerText = `${finalPrice.toFixed(2)}€`;
        document.getElementById('checkout-btn').style.display = 'block';
    }

    updateCartBadge(cartData, lang) {
        const badge = document.getElementById('cart-badge');
        if (badge) {
            // Calculate total quantity of items instead of just array length
            const totalCount = cartData.reduce((sum, item) => sum + (item.quantity || 1), 0);

            // Hardcoded "Cart" since we removed translation UI
            const prefix = "Cart";
            badge.innerText = totalCount > 0 ? `${prefix} (${totalCount})` : prefix;
        }
    }

    showToast(messageKey, lang, dynamicInsert = '') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        const msg = this.getTranslation(messageKey, lang);
        toast.innerText = dynamicInsert ? `${dynamicInsert} ${msg}` : msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    showServiceModal() {
        const overlay = document.getElementById('serviceModalOverlay');
        if (overlay) overlay.classList.add('active');
    }

    hideServiceModal() {
        const overlay = document.getElementById('serviceModalOverlay');
        if (overlay) overlay.classList.remove('active');
    }
}

window.appView = new AppView();
