// Функция для получения версии (хэш комита)
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
            const lines = text.trim().split('\n');
            return lines[0] || 'unknown';
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

