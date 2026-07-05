const fs = require('fs');
const path = require('path');

// Try to require pdfkit; if not installed, install it first then re-run
let PDFDocument;
try {
    PDFDocument = require('pdfkit');
} catch (e) {
    const { execSync } = require('child_process');
    console.log('Installing pdfkit...');
    execSync('npm install --no-save pdfkit', { stdio: 'inherit', cwd: __dirname });
    PDFDocument = require('pdfkit');
}

const ROOT = __dirname;
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md']);
const SKIP_DIRS = new Set(['node_modules', '.expo', '.git', 'android', 'ios', 'dist', 'build', '.antigravity']);

function collectFiles(dir) {
    let results = [];
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return results; }
    for (const e of entries) {
        if (SKIP_DIRS.has(e.name)) continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
            results = results.concat(collectFiles(full));
        } else if (EXTENSIONS.has(path.extname(e.name))) {
            results.push(full);
        }
    }
    return results;
}

const files = collectFiles(ROOT)
    // Skip the generated files themselves
    .filter(f => !f.includes('project_code') && !f.includes('gen_pdf'));

console.log(`Found ${files.length} source files. Generating PDF...`);

const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    bufferPages: true,
    info: {
        Title: 'Rumbala — Full Project Source Code',
        Author: 'Antigravity',
        Subject: 'Complete source code export',
        CreationDate: new Date(),
    }
});

const OUTPUT = path.join(ROOT, 'Rumbala_Project_Code.pdf');
const stream = fs.createWriteStream(OUTPUT);
doc.pipe(stream);

// ── Cover Page ─────────────────────────────────────────────────────────────
doc.rect(0, 0, doc.page.width, doc.page.height).fill('#1a1a2e');
doc.fill('#FF6B35')
   .fontSize(42)
   .font('Helvetica-Bold')
   .text('Rumbala', 50, 200, { align: 'center' });
doc.fill('#ffffff')
   .fontSize(18)
   .font('Helvetica')
   .text('Full Project Source Code Export', 50, 260, { align: 'center' });
doc.fill('rgba(255,255,255,0.4)')
   .fontSize(11)
   .text(`Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, 50, 300, { align: 'center' });
doc.fill('rgba(255,255,255,0.3)')
   .fontSize(10)
   .text(`${files.length} source files`, 50, 322, { align: 'center' });

// ── Table of Contents page ──────────────────────────────────────────────────
doc.addPage({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
doc.fill('#1a1a2e').fontSize(22).font('Helvetica-Bold').text('Table of Contents', { underline: false });
doc.moveDown(0.5);
doc.fontSize(9).font('Courier');
for (const f of files) {
    const rel = f.replace(ROOT + path.sep, '').replace(/\\/g, '/');
    doc.fill('#444444').text(`  ${rel}`, { lineBreak: true });
}

// ── Source Files ────────────────────────────────────────────────────────────
for (const f of files) {
    const rel = f.replace(ROOT + path.sep, '').replace(/\\/g, '/');
    const ext = path.extname(f).slice(1);

    doc.addPage({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });

    // File header bar
    doc.rect(50, 50, doc.page.width - 100, 28).fill('#1a1a2e');
    doc.fill('#FF6B35').fontSize(10).font('Helvetica-Bold')
       .text(rel, 58, 59, { width: doc.page.width - 116, ellipsis: true });

    doc.moveDown(2.2);

    let content;
    try {
        content = fs.readFileSync(f, 'utf8');
    } catch {
        content = '[Could not read file]';
    }

    // Truncate very large files to prevent huge PDFs
    const MAX_CHARS = 60000;
    if (content.length > MAX_CHARS) {
        content = content.slice(0, MAX_CHARS) + '\n\n... [truncated — file too large] ...';
    }

    doc.fill('#1a1a1a').fontSize(7.5).font('Courier')
       .text(content, {
           lineBreak: true,
           lineGap: 1,
           paragraphGap: 0,
       });
}

// ── Page numbers ─────────────────────────────────────────────────────────────
const range = doc.bufferedPageRange();
for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    doc.fill('#aaaaaa').fontSize(8).font('Helvetica')
       .text(`Page ${i + 1} of ${range.count}`, 50, doc.page.height - 40, {
           align: 'center',
           width: doc.page.width - 100,
       });
}

doc.end();

stream.on('finish', () => {
    const size = (fs.statSync(OUTPUT).size / 1024 / 1024).toFixed(2);
    console.log(`\n✅ PDF generated: ${OUTPUT}`);
    console.log(`   Size: ${size} MB`);
});

stream.on('error', (err) => {
    console.error('❌ Error writing PDF:', err.message);
});
