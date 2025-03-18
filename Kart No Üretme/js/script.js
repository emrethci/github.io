// Service Worker kaydı
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker başarıyla kaydedildi:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker kaydı başarısız:', error);
            });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Giriş ve kayıt sistemi için elementler
    const loginOverlay = document.getElementById('loginOverlay');
    const mainContent = document.getElementById('mainContent');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const authTabs = document.querySelectorAll('.auth-tab');
    
    // Input elementleri
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const regUsernameInput = document.getElementById('regUsername');
    const regPasswordInput = document.getElementById('regPassword');
    const regPasswordConfirmInput = document.getElementById('regPasswordConfirm');
    const cardInput = document.getElementById('cardInput');
    const quantityInput = document.getElementById('quantity');
    const generateBtn = document.getElementById('generateBtn');
    const cardNumberList = document.getElementById('cardNumberList');
    const colorButtons = document.querySelectorAll('.color-btn');
    const searchInput = document.getElementById('searchNumber');
    const searchBtn = document.getElementById('searchBtn');
    const searchResult = document.getElementById('searchResult');
    const recentCardsList = document.getElementById('recentCardsList');
    
    let selectedColor = null;
    let cardDatabase = [];

    // Yardımcı fonksiyonlar
    const formatCardNumber = (value) => {
        value = value.replace(/\s/g, '');
        if (value.length > 0) {
            value = value.match(/.{1,4}/g).join(' ');
        }
        return value;
    };

    const getColorCode = (color) => {
        switch (color) {
            case 'black': return '0001';
            case 'navy': return '0101';
            case 'gray': return '0301';
            case 'private-orange': return '0401';
            case 'private-black': return '0002';
            default: return '0000';
        }
    };

    const generateRandomFourDigits = () => {
        return Math.floor(1000 + Math.random() * 9000).toString();
    };

    const getCardTypeInTurkish = (type) => {
        switch (type) {
            case 'black': return 'Siyah';
            case 'navy': return 'Lacivert';
            case 'gray': return 'Gri';
            case 'private-orange': return 'Private Turuncu';
            case 'private-black': return 'Private Siyah';
            default: return type;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Veritabanı işlemleri
    const loadDatabase = () => {
        try {
            const saved = localStorage.getItem('cardDatabase');
            if (saved) {
                cardDatabase = JSON.parse(saved);
                console.log(`${cardDatabase.length} adet kart başarıyla yüklendi.`);
            } else {
                cardDatabase = [];
                console.log('Veritabanı bulunamadı, yeni bir veritabanı oluşturuldu.');
                localStorage.setItem('cardDatabase', JSON.stringify(cardDatabase));
            }
        } catch (error) {
            console.error('Veritabanı yüklenirken hata oluştu:', error);
            cardDatabase = [];
            localStorage.setItem('cardDatabase', JSON.stringify(cardDatabase));
        }
        
        updateRecentCards();
        updateCardStats();
    };

    const saveDatabase = () => {
        try {
            localStorage.setItem('cardDatabase', JSON.stringify(cardDatabase));
            console.log(`${cardDatabase.length} adet kart başarıyla kaydedildi.`);
        } catch (error) {
            console.error('Veritabanı kaydedilirken hata oluştu:', error);
            alert('Veritabanı kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
        }
        
        updateRecentCards();
        updateCardStats();
    };

    // Excel'e veri aktarma
    const exportToExcel = () => {
        if (cardDatabase.length === 0) {
            alert('Aktarılacak kart numarası bulunamadı!');
            return;
        }
        
        try {
            // Başlık satırı
            let csvContent = "Kart Numarası,Kart Tipi,Oluşturma Tarihi\n";
            
            // Veri satırları
            cardDatabase.forEach(card => {
                const formattedNumber = card.number.replace(/(\d{4})(?=\d)/g, '$1 ');
                const cardType = getCardTypeInTurkish(card.type);
                const createdAt = formatDate(card.createdAt);
                
                csvContent += `${formattedNumber},${cardType},${createdAt}\n`;
            });
            
            // CSV dosyasını oluştur
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            // Dosyayı indir
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `kart_numaralari_${new Date().toISOString().slice(0,10)}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            alert(`${cardDatabase.length} adet kart başarıyla dışa aktarıldı. Dosya indirilecek.`);
        } catch (error) {
            console.error('Dışa aktarma sırasında hata oluştu:', error);
            alert('Dışa aktarma sırasında bir hata oluştu. Lütfen tekrar deneyin.');
        }
    };

    const backupDatabase = () => {
        try {
            // Yedekleme verisini oluştur
            const backup = {
                data: cardDatabase,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            
            // JSON dosyasını oluştur
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Dosyayı indir
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `kart_numaralari_yedek_${new Date().toISOString().slice(0,10)}.json`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            alert(`Veritabanı başarıyla yedeklendi. Dosya indirilecek.`);
        } catch (error) {
            console.error('Yedekleme sırasında hata oluştu:', error);
            alert('Yedekleme sırasında bir hata oluştu. Lütfen tekrar deneyin.');
        }
    };

    const restoreDatabase = (jsonData) => {
        try {
            const backup = JSON.parse(jsonData);
            
            if (!backup.data || !Array.isArray(backup.data)) {
                throw new Error('Geçersiz yedekleme dosyası');
            }
            
            if (confirm(`Bu yedekleme dosyası ${backup.data.length} adet kart içeriyor. Mevcut veritabanı silinecek ve yerine bu yedek yüklenecek. Devam etmek istiyor musunuz?`)) {
                cardDatabase = backup.data;
                saveDatabase();
                alert('Veritabanı başarıyla geri yüklendi!');
            }
        } catch (error) {
            console.error('Geri yükleme sırasında hata oluştu:', error);
            alert('Geri yükleme sırasında bir hata oluştu. Lütfen geçerli bir yedekleme dosyası seçin.');
        }
    };

    const deleteCard = (cardNumber) => {
        cardDatabase = cardDatabase.filter(card => card.number !== cardNumber);
        saveDatabase();
    };

    // Kullanıcı işlemleri
    const loadUsers = () => {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : [];
    };

    const saveUser = (username, password) => {
        const users = loadUsers();
        users.push({ username, password });
        localStorage.setItem('users', JSON.stringify(users));
    };

    const checkUser = (username, password) => {
        const users = loadUsers();
        return users.find(user => user.username === username && user.password === password);
    };

    const isUsernameTaken = (username) => {
        const users = loadUsers();
        return users.some(user => user.username === username);
    };

    // UI işlemleri
    const showMainContent = () => {
        loginOverlay.classList.add('hidden');
        mainContent.classList.remove('hidden');
        loadDatabase();
        updateCardStats();
    };

    const showLoginForm = () => {
        loginOverlay.classList.remove('hidden');
        mainContent.classList.add('hidden');
        usernameInput.value = '';
        passwordInput.value = '';
    };

    const checkSession = () => {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (isLoggedIn === 'true') {
            showMainContent();
        } else {
            showLoginForm();
        }
    };

    const updateCardStats = () => {
        // Kart tipleri için sayıları tut
        const stats = {
            total: cardDatabase.length,
            types: {
                'private-black': 0,
                'private-orange': 0,
                'black': 0,
                'navy': 0,
                'gray': 0
            }
        };
        
        // Kart tiplerini say
        cardDatabase.forEach(card => {
            if (stats.types.hasOwnProperty(card.type)) {
                stats.types[card.type]++;
            }
        });
        
        // İstatistik elementini oluştur veya güncelle
        let statsContainer = document.getElementById('cardStats');
        if (!statsContainer) {
            statsContainer = document.createElement('div');
            statsContainer.id = 'cardStats';
            statsContainer.className = 'card-stats-container';
            
            // Elementleri doğru konuma ekle - sol sütuna ekleyelim
            const leftColumn = document.querySelector('.left-column');
            if (leftColumn) {
                leftColumn.insertBefore(statsContainer, leftColumn.firstChild);
            }
        }
        
        // İstatistikleri göster
        statsContainer.innerHTML = `
            <h2>Kart İstatistikleri</h2>
            <div class="stats-item">
                <span class="stats-label">Toplam Oluşturulan Kart:</span>
                <span class="stats-value">${stats.total}</span>
            </div>
            <div class="stats-breakdown">
                <div class="stats-item">
                    <span class="stats-label">Private Siyah:</span>
                    <span class="stats-value">${stats.types['private-black']}</span>
                </div>
                <div class="stats-item">
                    <span class="stats-label">Private Turuncu:</span>
                    <span class="stats-value">${stats.types['private-orange']}</span>
                </div>
                <div class="stats-item">
                    <span class="stats-label">Siyah:</span>
                    <span class="stats-value">${stats.types['black']}</span>
                </div>
                <div class="stats-item">
                    <span class="stats-label">Lacivert:</span>
                    <span class="stats-value">${stats.types['navy']}</span>
                </div>
                <div class="stats-item">
                    <span class="stats-label">Gri:</span>
                    <span class="stats-value">${stats.types['gray']}</span>
                </div>
            </div>
        `;
    };

    // Event Listeners
    // Tab değiştirme
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Aktif tab'ı değiştir
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Formları göster/gizle
            if (tab.dataset.tab === 'login') {
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
            } else {
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
            }
        });
    });

    // Kayıt işlemi
    const handleRegister = () => {
        const username = regUsernameInput.value;
        const password = regPasswordInput.value;
        const passwordConfirm = regPasswordConfirmInput.value;

        // Validasyonlar
        if (!username || !password || !passwordConfirm) {
            alert('Lütfen tüm alanları doldurun!');
            return;
        }

        if (password !== passwordConfirm) {
            alert('Şifreler eşleşmiyor!');
            return;
        }

        if (password.length < 5) {
            alert('Şifre en az 5 karakter olmalıdır!');
            return;
        }

        if (isUsernameTaken(username)) {
            alert('Bu kullanıcı adı zaten kullanılıyor!');
            return;
        }

        // Kullanıcıyı kaydet
        saveUser(username, password);
        alert('Kayıt başarılı! Giriş yapabilirsiniz.');

        // Login tab'ına geç
        authTabs[0].click();
        
        // Form'u temizle
        regUsernameInput.value = '';
        regPasswordInput.value = '';
        regPasswordConfirmInput.value = '';
    };

    // Giriş işlemi
    const handleLogin = () => {
        const username = usernameInput.value;
        const password = passwordInput.value;

        if (!username || !password) {
            alert('Lütfen kullanıcı adı ve şifrenizi girin!');
            return;
        }

        if (checkUser(username, password)) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('currentUser', username);
            showMainContent();
        } else {
            loginOverlay.classList.add('shake');
            setTimeout(() => {
                loginOverlay.classList.remove('shake');
            }, 500);
            alert('Kullanıcı adı veya şifre hatalı!');
        }
    };

    // Çıkış işlemi
    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        showLoginForm();
    };

    // Event listener'lar
    loginBtn.addEventListener('click', handleLogin);
    registerBtn.addEventListener('click', handleRegister);
    logoutBtn.addEventListener('click', handleLogout);
    
    // Excel'e aktarma, yedekleme ve geri yükleme butonları
    const exportBtn = document.getElementById('exportBtn');
    const backupBtn = document.getElementById('backupBtn');
    const restoreBtn = document.getElementById('restoreBtn');
    const restoreFile = document.getElementById('restoreFile');
    
    exportBtn.addEventListener('click', exportToExcel);
    backupBtn.addEventListener('click', backupDatabase);
    
    restoreBtn.addEventListener('click', () => {
        restoreFile.click();
    });
    
    restoreFile.addEventListener('change', (e) => {
        if (!e.target.files.length) return;
        
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                restoreDatabase(event.target.result);
            } catch (error) {
                console.error('Dosya okuma hatası:', error);
                alert('Dosya okunamadı. Lütfen geçerli bir yedekleme dosyası seçin.');
            }
        };
        
        reader.readAsText(file);
        
        // Dosya seçimi sıfırla (aynı dosyayı tekrar seçebilmek için)
        e.target.value = '';
    });

    // Enter tuşu ile giriş yapma
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });

    // Sadece sayı girişine izin ver ve formatla
    cardInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        
        // Renk seçildiyse, toplam 8 haneden fazlasına izin verme
        if (selectedColor) {
            if (value.length > 8) {
                value = value.slice(0, 8);
            }
        } else {
            // Renk seçilmediyse sadece ilk 6 haneye izin ver (4906 kısmı)
            if (value.length > 6) {
                value = value.slice(0, 6);
            }
        }
        
        if (value.length > 0) {
            e.target.value = formatCardNumber(value);
        } else {
            e.target.value = value;
        }
    });

    // Renk seçimi
    colorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 4906 xx00 0000 0000 formatında kart numarası oluşturma
            let colorDigits;
            switch (btn.dataset.color) {
                case 'private-black':
                    colorDigits = '01';
                    break;
                case 'private-orange':
                    colorDigits = '02';
                    break;
                case 'black':
                    colorDigits = '03';
                    break;
                case 'navy':
                    colorDigits = '04';
                    break;
                case 'gray':
                    colorDigits = '05';
                    break;
                default:
                    colorDigits = '00';
            }
            
            // Renk seçildiğinde 4906 xx00 formatında kart numarası oluştur
            const baseCardNumber = '4906';
            const formattedNumber = `${baseCardNumber}${colorDigits}`;
            
            colorButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedColor = btn.dataset.color;
            
            // Formatlanmış numarayı input'a koy
            cardInput.value = formatCardNumber(formattedNumber);
            cardInput.placeholder = 'Sonraki 2 haneyi girin';
        });
    });

    // Kart numarası oluşturma
    generateBtn.addEventListener('click', () => {
        const cardValue = cardInput.value.replace(/\s/g, '');
        const quantity = parseInt(quantityInput.value) || 1;
        
        // İlk 6 hane sabit (4906) + 2 hane renk kodu olmalı
        if (cardValue.length !== 8) {
            alert('Lütfen renk seçtikten sonra 2 hane daha girin! Toplam 8 hane olmalı.');
            return;
        }

        if (!selectedColor) {
            alert('Lütfen bir kart tipi seçin!');
            return;
        }

        if (quantity < 1 || quantity > 1000) {
            alert('Lütfen 1-1000 arası bir sayı girin!');
            return;
        }

        // Önceki sonuçları temizle
        cardNumberList.innerHTML = '';
        
        // Üretilen kart sayacı
        let generatedCount = 0;
        let duplicateCount = 0;

        // İstenen sayıda kart numarası oluştur
        for (let i = 0; i < quantity; i++) {
            // Son 8 hane için rastgele sayı oluştur
            const randomEight = Math.floor(10000000 + Math.random() * 90000000).toString();
            const fullNumber = `${cardValue.slice(0, 4)} ${cardValue.slice(4, 8)} ${randomEight.slice(0, 4)} ${randomEight.slice(4, 8)}`;
            const fullNumberRaw = fullNumber.replace(/\s/g, '');
            
            // Veritabanında kontrol et
            const isExisting = cardDatabase.some(card => card.number === fullNumberRaw);
            
            if (isExisting) {
                duplicateCount++;
                // Tekrar dene, ama sonsuz döngüye girme riski oluşmasın diye sadece 3 kere dene
                if (i < quantity - 1 || duplicateCount < 3) {
                    i--; // Tekrar dene
                    continue;
                }
            }
            
            // Veritabanına ekle
            cardDatabase.push({
                number: fullNumberRaw,
                type: selectedColor,
                createdAt: new Date().toISOString()
            });
            
            generatedCount++;

            // Kart numarası container'ı oluştur
            const container = document.createElement('div');
            container.className = 'card-number-container';

            // Kart numarası elementi
            const cardElement = document.createElement('div');
            cardElement.className = 'card-number';
            cardElement.textContent = fullNumber;

            // Kopyalama butonu
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-btn';
            copyButton.textContent = 'Kopyala';
            copyButton.onclick = () => copyToClipboard(fullNumber, copyButton);

            // Durum bilgisi ekle
            const statusElement = document.createElement('div');
            statusElement.className = 'card-status';
            statusElement.textContent = 'Yeni oluşturuldu';
            statusElement.style.color = '#28a745';
            
            // Elementleri container'a ekle
            container.appendChild(cardElement);
            container.appendChild(statusElement);
            container.appendChild(copyButton);
            cardNumberList.appendChild(container);
        }
        
        // Oluşturma durumunu göster
        const statusContainer = document.createElement('div');
        statusContainer.className = 'generation-status';
        statusContainer.innerHTML = `
            <h4>Oluşturma Durumu:</h4>
            <p>Toplam İstenen: ${quantity}</p>
            <p>Başarıyla Oluşturulan: ${generatedCount}</p>
            <p>Daha Önce Oluşturulmuş: ${duplicateCount}</p>
        `;
        cardNumberList.appendChild(statusContainer);
        
        // Veritabanını kaydet
        saveDatabase();
        
        // Kullanıcıya bilgi ver
        alert(`${generatedCount} adet kart numarası başarıyla oluşturuldu ve kaydedildi. Bu kart numaraları otomatik olarak yerel depolamada (localStorage) saklanmaktadır.`);
    });

    // Kart numarası sorgulama
    searchBtn.addEventListener('click', () => {
        const searchNumber = searchInput.value.replace(/\s/g, '');
        
        if (searchNumber.length !== 16) {
            searchResult.className = 'search-result error';
            searchResult.textContent = 'Lütfen 16 haneli kart numarasını girin!';
            return;
        }

        // Kart renk kodu kontrolü yap (4906XX formatını kontrol et)
        const colorPrefix = searchNumber.substring(4, 6);
        let cardType = '';
        
        switch (colorPrefix) {
            case '01':
                cardType = 'Private Siyah';
                break;
            case '02':
                cardType = 'Private Turuncu';
                break;
            case '03':
                cardType = 'Siyah';
                break;
            case '04':
                cardType = 'Lacivert';
                break;
            case '05':
                cardType = 'Gri';
                break;
            default:
                cardType = 'Bilinmeyen';
        }

        const foundCard = cardDatabase.find(card => card.number === searchNumber);
        
        if (foundCard) {
            searchResult.className = 'search-result error';
            searchResult.textContent = `Bu kart numarası zaten mevcut! (${getCardTypeInTurkish(foundCard.type)} tipinde)`;
        } else {
            searchResult.className = 'search-result success';
            searchResult.textContent = `Bu kart numarası kullanılabilir. Kart tipi: ${cardType}`;
        }
    });

    // Arama inputu için boşluk ekleme
    searchInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\s/g, '');
        value = value.replace(/[^0-9]/g, '');
        
        if (value.length > 0) {
            value = value.match(/.{1,4}/g).join(' ');
        }
        
        e.target.value = value;
    });

    // Son kayıtları güncelle
    const updateRecentCards = () => {
        recentCardsList.innerHTML = '';
        
        // Toplu silme butonu ekle
        const bulkActionContainer = document.createElement('div');
        bulkActionContainer.className = 'bulk-action-container';
        
        const selectAllCheckbox = document.createElement('input');
        selectAllCheckbox.type = 'checkbox';
        selectAllCheckbox.id = 'selectAll';
        
        const selectAllLabel = document.createElement('label');
        selectAllLabel.htmlFor = 'selectAll';
        selectAllLabel.textContent = 'Tümünü Seç';
        
        const deleteSelectedBtn = document.createElement('button');
        deleteSelectedBtn.className = 'delete-selected-btn';
        deleteSelectedBtn.textContent = 'Seçilenleri Sil';
        deleteSelectedBtn.style.display = 'none';
        
        bulkActionContainer.appendChild(selectAllCheckbox);
        bulkActionContainer.appendChild(selectAllLabel);
        bulkActionContainer.appendChild(deleteSelectedBtn);
        recentCardsList.appendChild(bulkActionContainer);

        // Son 50 kaydı göster, en yeniden en eskiye
        const recentCards = [...cardDatabase]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 50);

        // Checkbox durumunu kontrol et ve silme butonunu göster/gizle
        const checkSelectedCards = () => {
            const checkboxes = document.querySelectorAll('.card-checkbox');
            const hasSelected = Array.from(checkboxes).some(cb => cb.checked);
            deleteSelectedBtn.style.display = hasSelected ? 'block' : 'none';
            
            // Tümünü seç checkbox'ını güncelle
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            selectAllCheckbox.checked = allChecked;
        };

        // Tümünü seç/kaldır
        selectAllCheckbox.addEventListener('change', () => {
            const checkboxes = document.querySelectorAll('.card-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = selectAllCheckbox.checked;
            });
            checkSelectedCards();
        });

        // Seçili kartları sil
        deleteSelectedBtn.addEventListener('click', () => {
            const selectedCards = document.querySelectorAll('.card-checkbox:checked');
            if (selectedCards.length === 0) return;

            if (confirm(`${selectedCards.length} adet kartı silmek istediğinizden emin misiniz?`)) {
                const selectedNumbers = Array.from(selectedCards).map(cb => cb.dataset.cardNumber);
                cardDatabase = cardDatabase.filter(card => !selectedNumbers.includes(card.number));
                saveDatabase();
            }
        });

        recentCards.forEach(card => {
            const cardItem = document.createElement('div');
            cardItem.className = 'recent-card-item';

            // Checkbox ekle
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'card-checkbox';
            checkbox.dataset.cardNumber = card.number;
            checkbox.addEventListener('change', checkSelectedCards);

            // Kart numarası
            const cardNumber = document.createElement('div');
            cardNumber.textContent = card.number.replace(/(\d{4})/g, '$1 ').trim();

            // Kart tipi
            const cardType = document.createElement('div');
            cardType.className = `card-type ${card.type}`;
            cardType.textContent = getCardTypeInTurkish(card.type);

            // Tarih
            const cardDate = document.createElement('div');
            cardDate.className = 'card-date';
            cardDate.textContent = formatDate(card.createdAt);

            // Silme butonu
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-btn';
            deleteButton.textContent = 'Sil';
            deleteButton.onclick = () => {
                if (confirm('Bu kart numarasını silmek istediğinizden emin misiniz?')) {
                    deleteCard(card.number);
                }
            };

            // Elementleri ekle
            cardItem.appendChild(checkbox);
            cardItem.appendChild(cardNumber);
            cardItem.appendChild(cardType);
            cardItem.appendChild(cardDate);
            cardItem.appendChild(deleteButton);

            recentCardsList.appendChild(cardItem);
        });
    };

    // Kopyalama fonksiyonu
    const copyToClipboard = async (text, button) => {
        try {
            await navigator.clipboard.writeText(text);
            button.textContent = 'Kopyalandı!';
            button.classList.add('copied');
            setTimeout(() => {
                button.textContent = 'Kopyala';
                button.classList.remove('copied');
            }, 2000);
        } catch (err) {
            console.error('Kopyalama başarısız:', err);
            button.textContent = 'Hata!';
            setTimeout(() => {
                button.textContent = 'Kopyala';
            }, 2000);
        }
    };

    // Başlangıçta oturum kontrolü yap
    checkSession();
}); 