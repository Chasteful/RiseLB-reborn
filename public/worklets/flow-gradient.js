// @ts-nocheck
// public/worklets/flow-gradient.js
// flow-gradient-border.js
// animated-gradient-border.js
registerPaint('animatedGradientBorder', class {
  static get inputProperties() {
    return ['--gradient-colors', '--gradient-speed', '--border-width'];
  }

  paint(ctx, size, props) {
    const colors = props.get('--gradient-colors').toString().split(',');
    const speed = parseFloat(props.get('--gradient-speed').toString()) || 1;
    const width = parseFloat(props.get('--border-width').toString()) || 2;
    
    // 基于时间的动态计算（完全脱离主线程）
    const now = performance.now() / 1000;
    const progress = (now * speed) % 1;
    
    const gradient = ctx.createLinearGradient(
      0, 0, 
      size.width * 3, size.height * 3 // 放大渐变区域
    );
    
    // 动态色标（实现流动效果）
    colors.forEach((color, i) => {
      const pos = (i/colors.length + progress) % 1;
      gradient.addColorStop(pos, color.trim());
    });

    // 绘制带圆角的边框
    ctx.lineWidth = width;
    ctx.strokeStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(
      width/2, width/2,
      size.width - width, size.height - width,
      parseFloat(props.get('border-radius')) || 12
    );
    ctx.stroke();
  }
});