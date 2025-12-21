#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
    // Получаем количество коммитов
    const commitCount = execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim();
    const versionNumber = parseInt(commitCount, 10) + 1;
    const version = `0.${versionNumber}`;
    
    // Записываем версию в version.txt
    const versionPath = path.join(__dirname, '..', 'version.txt');
    fs.writeFileSync(versionPath, version, 'utf-8');
    
    console.log(`Версия обновлена: ${version}`);
} catch (error) {
    console.error('Ошибка при обновлении версии:', error.message);
    process.exit(1);
}

