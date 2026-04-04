const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function createIcon(size, outputPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // 背景色 - 橙棕色
  ctx.fillStyle = '#D4916E';
  ctx.fillRect(0, 0, size, size);

  // 绘制白色 "M" 字母
  ctx.fillStyle = 'white';
  ctx.font = `bold ${Math.floor(size * 0.6)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('M', size / 2, size / 2);

  // 保存为 PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Created: ${outputPath}`);
}

// 创建输出目录
const iconsDir = path.join(__dirname, '../dist/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 创建三个尺寸的图标
createIcon(16, path.join(iconsDir, 'icon-16.png'));
createIcon(48, path.join(iconsDir, 'icon-48.png'));
createIcon(128, path.join(iconsDir, 'icon-128.png'));

console.log('\n🎉 所有图标创建成功！');
