// static/script.js

const tg = window.Telegram?.WebApp;

if (tg) {
    tg.MainButton.hide();
    tg.setHeaderColor('#1a1a2e');
    tg.setBackgroundColor('#1a1a2e');
    tg.expand();
}

let currentProductId = null;
let products = [];
let currentSliderInterval = null;
let currentSlideIndex = 0;
let totalSlides = 0;

// Переменные для свайпов
let isDown = false;
let startX;
let scrollLeft;

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    if (tg?.BackButton) {
        tg.BackButton.hide();
    }
}

document.getElementById('start-btn')?.addEventListener('click', () => {
    loadProducts();
    showScreen('products-screen');
    
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
});

async function loadProducts() {
    try {
        const res = await fetch('/api/products');
        products = await res.json();
        renderProducts();
    } catch (e) {
        console.error('Ошибка загрузки товаров:', e);
    }
}

function renderProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = products.map(p => `
        <div class="product-card" onclick="showProductDetail(${p.id})">
            <img src="${p.images[0]}" alt="${p.name}" class="product-image" onerror="this.src='https://via.placeholder.com/400x600/333/666?text=No+Photo'">
            <div class="product-info">
                <div class="product-name">${p.name}, ${p.age}</div>
                <div class="product-price">${p.price} ₽</div>
            </div>
        </div>
    `).join('');
}

async function showProductDetail(id) {
    try {
        const res = await fetch(`/api/product/${id}`);
        const product = await res.json();
        
        if (product.error) throw new Error(product.error);
        
        currentProductId = id;
        
        document.getElementById('detail-name').textContent = `${product.name}, ${product.age}`;
        document.getElementById('detail-params').textContent = product.parameters;
        document.getElementById('detail-price').textContent = `${product.price} ₽`;
        
        const slider = document.getElementById('slider-container');
        const dotsContainer = document.getElementById('slider-dots');
        slider.innerHTML = '';
        dotsContainer.innerHTML = '';
        
        // Очищаем интервал
        if (currentSliderInterval) {
            clearInterval(currentSliderInterval);
            currentSliderInterval = null;
        }
        
        totalSlides = product.images.length;
        currentSlideIndex = 0;
        
        // Создаём слайды для ВСЕХ фотографий
        product.images.forEach((img, idx) => {
            const imgElement = document.createElement('img');
            imgElement.src = img;
            imgElement.alt = `Photo ${idx + 1}`;
            imgElement.onerror = function() {
                this.src = 'https://via.placeholder.com/400x600/333/666?text=No+Photo';
            };
            slider.appendChild(imgElement);
            
            // Создаём точку для каждого слайда
            const dot = document.createElement('div');
            dot.className = 'slider-dot';
            if (idx === 0) dot.classList.add('active');
            dot.onclick = () => goToSlide(idx);
            dotsContainer.appendChild(dot);
        });
        
        // Инициализация свайпов
        initSwipe(slider);
        
        // Авто-переключение слайдов (только если больше 1 фото)
        if (product.images.length > 1) {
            currentSliderInterval = setInterval(() => {
                currentSlideIndex = (currentSlideIndex + 1) % totalSlides;
                goToSlide(currentSlideIndex);
            }, 4000);
        }
        
        showScreen('detail-screen');
        
        if (tg?.BackButton) {
            tg.BackButton.show();
            tg.BackButton.onClick(() => showProducts());
        }
        
    } catch (e) {
        console.error('Ошибка загрузки товара:', e);
    }
}

// Инициализация свайпов
function initSwipe(slider) {
    // Сброс предыдущих обработчиков
    const newSlider = slider.cloneNode(true);
    slider.parentNode.replaceChild(newSlider, slider);
    
    // Mouse events (для ПК)
    newSlider.addEventListener('mousedown', (e) => {
        isDown = true;
        newSlider.style.cursor = 'grabbing';
        startX = e.pageX - newSlider.offsetLeft;
        scrollLeft = parseInt(getComputedStyle(newSlider).transform.split(',')[4]) || 0;
    });
    
    newSlider.addEventListener('mouseleave', () => {
        isDown = false;
        newSlider.style.cursor = 'grab';
    });
    
    newSlider.addEventListener('mouseup', () => {
        isDown = false;
        newSlider.style.cursor = 'grab';
    });
    
    newSlider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - newSlider.offsetLeft;
        const walk = (x - startX) * 2;
        // Можно добавить визуальный эффект перетаскивания
    });
    
    // Touch events (для мобильных)
    newSlider.addEventListener('touchstart', (e) => {
        isDown = true;
        startX = e.touches[0].pageX - newSlider.offsetLeft;
        scrollLeft = parseInt(getComputedStyle(newSlider).transform.split(',')[4]) || 0;
    }, {passive: true});
    
    newSlider.addEventListener('touchend', (e) => {
        if (!isDown) return;
        isDown = false;
        
        const x = e.changedTouches[0].pageX - newSlider.offsetLeft;
        const diff = x - startX;
        
        // Если свайп достаточно сильный
        if (Math.abs(diff) > 50) {
            if (diff < 0) {
                // Свайп влево — следующее фото
                if (currentSlideIndex < totalSlides - 1) {
                    goToSlide(currentSlideIndex + 1);
                }
            } else {
                // Свайп вправо — предыдущее фото
                if (currentSlideIndex > 0) {
                    goToSlide(currentSlideIndex - 1);
                }
            }
        }
    }, {passive: true});
}

function goToSlide(idx) {
    const slider = document.getElementById('slider-container');
    const dots = document.querySelectorAll('.slider-dot');
    
    currentSlideIndex = idx;
    
    slider.style.transform = `translateX(-${idx * 100}%)`;
    
    dots.forEach((d, i) => {
        d.classList.toggle('active', i === idx);
    });
}

function showProducts() {
    if (currentSliderInterval) {
        clearInterval(currentSliderInterval);
        currentSliderInterval = null;
    }
    showScreen('products-screen');
}

async function makeCall() {
    try {
        const res = await fetch('/api/phone');
        const { phone } = await res.json();
        
        await navigator.clipboard.writeText(phone);
        
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
        }
        
        alert(`Номер ${phone} скопирован!\nТеперь вы можете позвонить через телефон.`);
        
    } catch (e) {
        console.error('Ошибка получения номера:', e);
        alert('Не удалось получить номер. Попробуйте позже.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (tg?.ready) {
        tg.ready();
    }
});