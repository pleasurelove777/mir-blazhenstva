// static/script.js

// Инициализация Telegram WebApp
const tg = window.Telegram?.WebApp;

if (tg) {
    // ✅ Убираем нативную зелёную кнопку внизу
    tg.MainButton.hide();
    
    // ✅ Кастомизируем цвета под наш дизайн
    tg.setHeaderColor('#1a1a2e');
    tg.setBackgroundColor('#1a1a2e');
    
    // ✅ Разворачиваем на весь экран
    tg.expand();
    
    // ✅ Отключаем вертикальную прокрутку страницы (опционально)
    // tg.disableVerticalSwipes();
}

// Глобальные переменные
let currentProductId = null;
let products = [];

// Переключение экранов
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    // Скрываем нативную кнопку назад Telegram, если есть
    if (tg?.BackButton) {
        tg.BackButton.hide();
    }
}

// Старт
document.getElementById('start-btn')?.addEventListener('click', () => {
    loadProducts();
    showScreen('products-screen');
    
    // Haptic feedback если доступен
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
});

// Загрузка товаров
async function loadProducts() {
    try {
        const res = await fetch('/api/products');
        products = await res.json();
        renderProducts();
    } catch (e) {
        console.error('Ошибка загрузки товаров:', e);
    }
}

// Рендер карточек
function renderProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = products.map(p => `
        <div class="product-card" onclick="showProductDetail(${p.id})">
            <img src="${p.images[0].trim()}" alt="${p.name}" class="product-image" onerror="this.src='https://via.placeholder.com/400x600/333/666?text=No+Photo'">
            <div class="product-info">
                <div class="product-name">${p.name}, ${p.age}</div>
                <div class="product-price">${p.price} ₽</div>
            </div>
        </div>
    `).join('');
}

// Детали товара
async function showProductDetail(id) {
    try {
        const res = await fetch(`/api/product/${id}`);
        const product = await res.json();
        
        if (product.error) throw new Error(product.error);
        
        currentProductId = id;
        
        // Заполняем данные
        document.getElementById('detail-name').textContent = `${product.name}, ${product.age}`;
        document.getElementById('detail-params').textContent = product.parameters;
        document.getElementById('detail-price').textContent = `${product.price} ₽`;
        
        // Слайдер изображений
        const slider = document.getElementById('slider-container');
        const dots = document.getElementById('slider-dots');
        slider.innerHTML = '';
        dots.innerHTML = '';
        
        product.images.forEach((img, idx) => {
            const cleanImg = img.trim();
            slider.innerHTML += `<img src="${cleanImg}" alt="Photo ${idx+1}">`;
            
            const dot = document.createElement('div');
            dot.className = `slider-dot${idx === 0 ? ' active' : ''}`;
            dot.onclick = () => goToSlide(idx);
            dots.appendChild(dot);
        });
        
        // Авто-слайдер
        let slideIdx = 0;
        window.currentSliderInterval = setInterval(() => {
            slideIdx = (slideIdx + 1) % product.images.length;
            goToSlide(slideIdx);
        }, 4000);
        
        showScreen('detail-screen');
        
        // Показываем нативную кнопку "Назад" от Telegram (опционально)
        if (tg?.BackButton) {
            tg.BackButton.show();
            tg.BackButton.onClick(() => showProducts());
        }
        
    } catch (e) {
        console.error('Ошибка загрузки товара:', e);
    }
}

function goToSlide(idx) {
    const slider = document.getElementById('slider-container');
    const dots = document.querySelectorAll('.slider-dot');
    slider.style.transform = `translateX(-${idx * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
}

function showProducts() {
    // Очищаем интервал слайдера
    if (window.currentSliderInterval) {
        clearInterval(window.currentSliderInterval);
    }
    showScreen('products-screen');
}

// Звонок
async function makeCall() {
    try {
        const res = await fetch('/api/phone');
        const { phone } = await res.json();
        
        // Копируем номер в буфер
        await navigator.clipboard.writeText(phone);
        
        // Вибрация и алерт
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
        }
        
        alert(`Номер ${phone} скопирован!\nТеперь вы можете позвонить через телефон.`);
        
        // Опционально: открыть dialer (работает не везде)
        // window.location.href = `tel:${phone.replace(/\s/g, '')}`;
        
    } catch (e) {
        console.error('Ошибка получения номера:', e);
        alert('Не удалось получить номер. Попробуйте позже.');
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Готово — можно показать welcome
    if (tg?.ready) {
        tg.ready();
    }
});