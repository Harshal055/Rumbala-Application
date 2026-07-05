const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const origBase = path.join(process.cwd(), 'tmp/orig/node_modules/agora-react-native-rtm');
const modBase = path.join(process.cwd(), 'node_modules/agora-react-native-rtm');
const patchFile = path.join(process.cwd(), 'patches/agora-react-native-rtm+1.5.1.patch');

const filesToDiff = [
    'lib/commonjs/RtmEngine.js',
    'lib/module/RtmEngine.js',
    'src/RtmEngine.ts'
];

function generateDiff(file) {
    const origPath = path.join(origBase, file);
    const modPath = path.join(modBase, file);
    
    // Using a simple line-by-line diff if 'diff' command is not available
    // But since I'm on Windows, maybe I can use 'fc' or just do it in JS
    
    const origLines = fs.readFileSync(origPath, 'utf8').split(/\r?\n/);
    const modLines = fs.readFileSync(modPath, 'utf8').split(/\r?\n/);
    
    // For simplicity, we want a format compatible with patch-package
    // patch-package uses 'diff --git a/node_modules/... b/node_modules/...'
    
    let diff = `diff --git a/node_modules/agora-react-native-rtm/${file} b/node_modules/agora-react-native-rtm/${file}\n`;
    diff += `--- a/node_modules/agora-react-native-rtm/${file}\n`;
    diff += `+++ b/node_modules/agora-react-native-rtm/${file}\n`;
    
    // We'll use a very basic chunking to avoid writing a full Myers diff
    // Since I've made contiguous-ish blocks of changes, this might be tricky.
    // Actually, I'll just use 'diff' if it's in the environment.
    try {
        // Try Windows native 'fc' (not compatible) or 'git diff' (if available)
        // Since I know git is missing, I'll try to find 'diff'
        return execSync(`diff -u "${origPath}" "${modPath}"`, { encoding: 'utf8' })
            .replace(origPath, `a/node_modules/agora-react-native-rtm/${file}`)
            .replace(modPath, `b/node_modules/agora-react-native-rtm/${file}`);
    } catch (e) {
        // If diff -u fails, we'll try a fallback or just return the full file diff
        // (But that's too big).
        console.error('Diff command failed, please provide a proper diff.');
        return '';
    }
}

let finalPatch = '';
filesToDiff.forEach(file => {
    const d = generateDiff(file);
    if (d) finalPatch += d + '\n';
});

if (finalPatch) {
    fs.writeFileSync(patchFile, finalPatch);
    console.log('Patch regenerated successfully.');
} else {
    console.log('No changes detected or diff failed.');
}
