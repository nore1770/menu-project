/**
 * CONTROLLER
 * Orchestrates events between Model and View (i18n, Drag&Drop, Tipping, Filtering)
 */
class AppController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        
        // UI State
        this.currentCategory = 'all';
        this.currentFilters = [];

        this.init();
    }

    async init() {
        await this.model.fetchMenuData(); // Ensure menu data is loaded first
        const lang = this.model.getLanguage();
        this.applyLanguage(lang);
        
        this.refreshMenuAndHomeView();
        this.refreshCartView();
        this.attachEventListeners();
    }

    applyLanguage(lang) {
        this.model.setLanguage(lang);
        this.view.translatePage(lang);
        this.view.updateCartBadge(this.model.getCart(), lang);
        
        const sw = document.getElementById('langSwitcher');
        if (sw) sw.value = lang;
    }

    refreshMenuAndHomeView() {
        const lang = this.model.getLanguage();
        
        // Start Page
        const isStartPage = document.getElementById("trending-container");
        if (isStartPage) {
            this.view.renderHomeData(this.model.menuData, lang);
        }

        // Menu Page
        const isMenuPage = document.getElementById("menu-sections-container");
        if (isMenuPage) {
            this.view.renderMenuCategories(lang, this.currentCategory);
            this.view.renderMenuFilters(lang, this.currentCategory, this.currentFilters);
            this.view.renderMenu(this.model.menuData, lang, this.currentCategory, this.currentFilters);
        }
    }

    refreshCartView() {
        const lang = this.model.getLanguage();
        const isCartPage = document.getElementById('cart-content');
        if (isCartPage) {
            const cartItems = this.model.getCart();
            const total = this.model.getCartTotal();
            const tip = this.model.tipRate;
            this.view.renderCart(cartItems, total, tip, lang);
            this.view.translatePage(lang); // Re-translate since inner HTML changed
        }
        this.view.updateCartBadge(this.model.getCart(), lang);
    }

    attachEventListeners() {
        const lang = () => this.model.getLanguage();

        // Tipping changes
        document.addEventListener('change', (e) => {
            if (e.target.matches('#tip-select')) {
                this.model.setTipRate(e.target.value);
                this.refreshCartView();
            }
        });

        // Click events
        document.addEventListener('click', (e) => {
            
            // Category Navigation
            const catTab = e.target.closest('.category-tab');
            if (catTab) {
                this.currentCategory = catTab.getAttribute('data-category');
                this.currentFilters = []; // Reset filters on category switch
                this.refreshMenuAndHomeView();
                return;
            }

            // Filters Navigation
            const filterChip = e.target.closest('.filter-chip');
            if (filterChip) {
                const filterId = filterChip.getAttribute('data-filter');
                const idx = this.currentFilters.indexOf(filterId);
                if (idx > -1) {
                    this.currentFilters.splice(idx, 1);
                } else {
                    this.currentFilters.push(filterId);
                }
                this.refreshMenuAndHomeView();
                return;
            }

            // "Add to Cart" button clicked on Menu Page
            if (e.target.matches('.add-button:not(.remove-btn)')) {
                const dishStr = e.target.getAttribute('data-dish');
                if (dishStr) {
                    const dish = JSON.parse(dishStr.replace(/&apos;/g, "'"));
                    this.handleAddToCart(dish);
                }
            }

            // "Remove from Cart" button
            if (e.target.matches('.remove-btn')) {
                const index = e.target.getAttribute('data-index');
                if (index !== null) {
                    this.model.removeFromCart(parseInt(index));
                    this.refreshCartView();
                }
            }

            // "+" Button Context
            if (e.target.matches('.qty-plus')) {
                const index = e.target.getAttribute('data-index');
                if (index !== null) {
                    this.model.updateQuantity(parseInt(index), 1);
                    this.refreshCartView();
                }
            }

            // "-" Button Context
            if (e.target.matches('.qty-minus')) {
                const index = e.target.getAttribute('data-index');
                if (index !== null) {
                    this.model.updateQuantity(parseInt(index), -1);
                    this.refreshCartView();
                }
            }

            // Floating "Call Service" button
            const isCallBtn = e.target.closest('.call-service-btn');
            if (isCallBtn) {
                this.view.showServiceModal();
            }

            // Modal Controls
            if (e.target.matches('#btnConfirmService')) {
                this.view.hideServiceModal();
                this.view.showToast("toastSrv", lang());
            }
            // Close Service Modal
            if (e.target.matches('#btnCancelService') || e.target.matches('#serviceModalOverlay')) {
                this.view.hideServiceModal();
            }

            // --- Dish Details Modal Event Logics ---
            
            // View Dish Details (clicking a card, but not the add button)
            const cardEl = e.target.closest('.card');
            if (cardEl && !e.target.closest('.add-button')) {
                const dishStr = cardEl.getAttribute('data-dish');
                if (dishStr) {
                    const dishData = JSON.parse(dishStr);
                    this.view.openDishModal(dishData, this.model.language);
                }
            }

            // Close Dish Modal
            if (e.target.matches('#btnDishModalClose') || e.target.matches('#dishModalOverlay')) {
                this.view.closeDishModal();
            }

            // Add from Dish Modal
            if (e.target.matches('#btnDishModalAdd')) {
                const dishData = JSON.parse(e.target.getAttribute('data-dish'));
                this.model.addToCart(dishData);
                this.refreshCartView();
                this.view.showToast('toastAdd', this.model.language, dishData.name);
                this.view.closeDishModal(); // Automatically close overlay to keep user flow fast
            }
        });


        // ---------------------------------
        // Drag and Drop Logic to Cart Nav Link
        // ---------------------------------
        document.addEventListener('dragstart', (e) => {
            if (e.target.closest('.draggable-card')) {
                const card = e.target.closest('.draggable-card');
                e.dataTransfer.setData('application/json', card.getAttribute('data-dish'));
                card.classList.add('dragging');
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.closest('.draggable-card')) {
                e.target.closest('.draggable-card').classList.remove('dragging');
            }
        });

        const dropTarget = document.getElementById('cart-nav-link');
        if (dropTarget) {
            dropTarget.addEventListener('dragover', (e) => {
                e.preventDefault(); // Necessary to allow dropping
                dropTarget.classList.add('drag-over');
            });

            dropTarget.addEventListener('dragleave', (e) => {
                dropTarget.classList.remove('drag-over');
            });

            dropTarget.addEventListener('drop', (e) => {
                e.preventDefault();
                dropTarget.classList.remove('drag-over');
                
                const dishDataStr = e.dataTransfer.getData('application/json');
                if (dishDataStr) {
                    const dish = JSON.parse(dishDataStr.replace(/&apos;/g, "'"));
                    this.handleAddToCart(dish);
                }
            });
        }
    }

    handleAddToCart(dish) {
        this.model.addToCart(dish);
        this.refreshCartView();
        
        // Add a small vibration/shake animation to the cart button to signify addition
        const cartLink = document.getElementById('cart-nav-link');
        if(cartLink) {
            cartLink.style.transform = "scale(1.2)";
            setTimeout(() => { cartLink.style.transform = "scale(1)"; }, 200);
        }

        this.view.showToast("toastAdd", this.model.getLanguage(), dish.name);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.appController = new AppController(window.appModel, window.appView);
});
