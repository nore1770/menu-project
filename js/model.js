/**
 * MODEL
 * Manages data (Menu, Cart, Language, Tip)
 */
class MenuModel {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('grandHotelCart')) || [];
        this.menuData = {};
        this.language = 'en'; 
        this.tipRate = 0; // 0, 0.10, 0.15
    }

    async fetchMenuData() {
        try {
            const response = await fetch('data/menu.json');
            this.menuData = await response.json();
            return this.menuData;
        } catch (error) {
            console.error('Failed to fetch menu:', error);
            return {};
        }
    }

    getMenuCategory(category) {
        return this.menuData[category] || [];
    }

    getCart() {
        return this.cart;
    }

    addToCart(item) {
        const existing = this.cart.find(c => c.id === item.id);
        if (existing) {
            existing.quantity = (existing.quantity || 1) + 1;
        } else {
            this.cart.push({
                id: item.id || Date.now().toString(),
                name: item.name,
                price: item.price,
                quantity: 1
            });
        }
        this.saveCart();
    }

    removeFromCart(index) {
        this.cart.splice(index, 1);
        this.saveCart();
    }

    updateQuantity(index, delta) {
        if (this.cart[index]) {
            this.cart[index].quantity = (this.cart[index].quantity || 1) + delta;
            if (this.cart[index].quantity <= 0) {
                this.removeFromCart(index);
            } else {
                this.saveCart();
            }
        }
    }

    saveCart() {
        localStorage.setItem('grandHotelCart', JSON.stringify(this.cart));
    }

    getCartTotal() {
        return this.cart.reduce((sum, item) => {
            const numPrice = parseFloat(item.price) || 0;
            const q = item.quantity || 1;
            return sum + (numPrice * q);
        }, 0);
    }
    
    getTipAmount() {
        return this.getCartTotal() * this.tipRate;
    }

    setTipRate(rate) {
        this.tipRate = parseFloat(rate);
    }

    setLanguage(lang) {
        this.language = lang;
        localStorage.setItem('grandHotelLang', lang);
    }

    getLanguage() {
        return this.language;
    }
}

window.appModel = new MenuModel();
