// Функция для получения версии (формат 0.№ где № - количество коммитов + 1)
async function getVersion() {
    // Проверяем, запущено ли через file:// протокол
    if (window.location.protocol === 'file:') {
        // При открытии через file:// используем встроенную версию или пропускаем
        return 'local';
    }
    
    try {
        const response = await fetch('version.txt');
        if (response.ok) {
            const text = await response.text();
            // Очищаем текст от всех невидимых символов и берём первую строку
            const cleaned = text.trim().replace(/[\r\n]+/g, '\n').split('\n')[0];
            // Убираем все не-ASCII символы, оставляем только буквы, цифры, точки и дефисы
            const version = cleaned.replace(/[^\w.-]/g, '').trim();
            return version || 'unknown';
        }
    } catch (error) {
        // Игнорируем ошибки CORS при локальном открытии
        console.debug('Version file not available (expected when opening via file://)');
    }
    return 'local';
}

// Функция для отображения версии на странице
async function displayVersion() {
    const version = await getVersion();
    const versionElement = document.getElementById('version');
    if (versionElement) {
        if (version === 'local') {
            versionElement.textContent = 'Версия: локальная (откройте через HTTP сервер для отображения версии)';
        } else {
            versionElement.textContent = `Версия: ${version}`;
        }
    }
}

