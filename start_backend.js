/**
 * Скрипт для запуска Python-бэкенда
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Проверяем наличие Python
function checkPython() {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', ['--version']);
        
        pythonProcess.on('error', (err) => {
            console.error('Ошибка при проверке Python:', err);
            reject(new Error('Python не найден. Убедитесь, что Python установлен и доступен в PATH.'));
        });
        
        pythonProcess.stdout.on('data', (data) => {
            console.log(`Версия Python: ${data.toString().trim()}`);
            resolve(true);
        });
        
        pythonProcess.stderr.on('data', (data) => {
            console.error(`Ошибка при проверке версии Python: ${data.toString().trim()}`);
            reject(new Error('Ошибка при проверке версии Python.'));
        });
    });
}

// Устанавливаем зависимости Python
function installDependencies() {
    return new Promise((resolve, reject) => {
        console.log('Установка зависимостей Python...');
        
        const pipProcess = spawn('pip', ['install', '-r', 'requirements.txt']);
        
        pipProcess.on('error', (err) => {
            console.error('Ошибка при установке зависимостей:', err);
            reject(new Error('Не удалось установить зависимости. Убедитесь, что pip установлен и доступен в PATH.'));
        });
        
        pipProcess.stdout.on('data', (data) => {
            console.log(`pip: ${data.toString().trim()}`);
        });
        
        pipProcess.stderr.on('data', (data) => {
            console.error(`pip error: ${data.toString().trim()}`);
        });
        
        pipProcess.on('close', (code) => {
            if (code === 0) {
                console.log('Зависимости успешно установлены.');
                resolve(true);
            } else {
                reject(new Error(`Ошибка при установке зависимостей. Код выхода: ${code}`));
            }
        });
    });
}

// Запускаем Python-бэкенд
function startBackend() {
    return new Promise((resolve, reject) => {
        console.log('Запуск Python-бэкенда...');
        
        const pythonProcess = spawn('python', ['fragment_backend.py']);
        
        pythonProcess.on('error', (err) => {
            console.error('Ошибка при запуске бэкенда:', err);
            reject(new Error('Не удалось запустить Python-бэкенд.'));
        });
        
        pythonProcess.stdout.on('data', (data) => {
            console.log(`Backend: ${data.toString().trim()}`);
            
            // Проверяем, запустился ли сервер
            if (data.toString().includes('Running on')) {
                console.log('Python-бэкенд успешно запущен.');
                resolve(pythonProcess);
            }
        });
        
        pythonProcess.stderr.on('data', (data) => {
            console.error(`Backend error: ${data.toString().trim()}`);
        });
        
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Python-бэкенд завершил работу с кодом: ${code}`));
            }
        });
        
        // Устанавливаем таймаут на запуск
        setTimeout(() => {
            resolve(pythonProcess);
        }, 5000);
    });
}

// Основная функция
async function main() {
    try {
        // Проверяем наличие Python
        await checkPython();
        
        // Устанавливаем зависимости
        await installDependencies();
        
        // Запускаем бэкенд
        const backendProcess = await startBackend();
        
        // Обрабатываем завершение работы
        process.on('SIGINT', () => {
            console.log('Завершение работы...');
            backendProcess.kill();
            process.exit(0);
        });
        
        console.log('Бэкенд запущен и готов к работе.');
    } catch (error) {
        console.error('Ошибка:', error.message);
        process.exit(1);
    }
}

// Запускаем основную функцию
main();