import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, '../src');

// Мапа замін: Svelte 5 -> Svelte 4
const replacements = [
    { from: /onclick=\{/g, to: 'on:click={' },
    { from: /onkeydown=\{/g, to: 'on:keydown={' },
    { from: /onchange=\{/g, to: 'on:change={' },
    { from: /oninput=\{/g, to: 'on:input={' },
    { from: /onmouseenter=\{/g, to: 'on:mouseenter={' },
    { from: /onmouseleave=\{/g, to: 'on:mouseleave={' },
    { from: /onfocus=\{/g, to: 'on:focus={' },
    { from: /onblur=\{/g, to: 'on:blur={' },
    { from: /onmouseover=\{/g, to: 'on:mouseover={' },
    // Виправлення специфічної помилки присвоєння
    { from: /on:click=\{close\}/g, to: 'on:click={close}' },
];

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            callback(path.join(dir, f));
        }
    });
}

console.log('🚀 Починаю виправлення синтаксису Svelte...');

let fixedCount = 0;

walkDir(srcDir, (filePath) => {
    if (filePath.endsWith('.svelte')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        replacements.forEach(({ from, to }) => {
            content = content.replace(from, to);
        });

        // Додаткове виправлення для LobbyChat.svelte (TypeScript помилка)
        if (filePath.includes('LobbyChat.svelte')) {
            content = content.replace(
                'unsubscribe = roomService.subscribeToChat(roomId, (msgs) => {',
                'unsubscribe = roomService.subscribeToChat(roomId, (msgs: ChatMessage[]) => {'
            );
        }

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Виправлено: ${path.relative(srcDir, filePath)}`);
            fixedCount++;
        }
    }
});

console.log(`\n🎉 Готово! Виправлено файлів: ${fixedCount}`);
console.log('⚠️  Увага: Файл src/lib/stores/gameSettingsPresets.ts потрібно оновити вручну або скопіювати з попереднього чату, оскільки там логічні зміни.');