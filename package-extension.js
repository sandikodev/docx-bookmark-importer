import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const __dirname = path.resolve();
const output = fs.createWriteStream(path.join(__dirname, 'docx-bookmark-importer-extension.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 }
});

output.on('close', () => {
  console.log(`\n✅ Extension packaged successfully!`);
  console.log(`📁 File: docx-bookmark-importer-extension.zip`);
  console.log(`📊 Size: ${(archive.pointer() / 1024).toFixed(2)} KB`);
  console.log(`\nNext steps: Upload this ZIP to the Chrome Web Store Developer Dashboard.`);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);
archive.directory('dist/', false);
archive.finalize();
