<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
  
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
  
    // 模拟的模块数据
    let modules = [
      { name: "Module 1", enabled: true, position: { x: 50, y: 50 }, size: { width: 200, height: 30 } },
      { name: "Module 2", enabled: false, position: { x: 50, y: 100 }, size: { width: 200, height: 30 } },
      { name: "Module 3", enabled: true, position: { x: 50, y: 150 }, size: { width: 200, height: 30 } }
    ];
  
    // 初始化 canvas 绘图上下文
    onMount(() => {
      if (canvas) {
        ctx = canvas.getContext('2d');
        if (ctx) {
          resizeCanvas();
          draw();  // 初始绘制
        }
  
        window.addEventListener('resize', resizeCanvas); // 调整大小
      }
  
      return () => {
        window.removeEventListener('resize', resizeCanvas); // 清理
      };
    });
  
    // 自定义绘制函数
    function resizeCanvas() {
      if (canvas) {
        canvas.width = window.innerWidth; // 使用窗口的宽度
        canvas.height = window.innerHeight; // 使用窗口的高度
        draw(); // 重绘
      }
    }
  
    function draw() {
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // 清空画布
  
        // 绘制面板
        drawPanel();
        
        // 绘制模块
        drawModules();
      }
    }
  
    function drawPanel() {
      if (ctx && canvas) {
        // 绘制面板背景和边框
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
  
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      }
    }
  
    function drawModules() {
      if (ctx) {
        modules.forEach(module => {
          drawModule(module);
        });
      }
    }
  
    function drawModule(module: any) {
      if (ctx) {
        // 绘制模块的背景
        ctx.fillStyle = module.enabled ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)';
        ctx.fillRect(module.position.x, module.position.y, module.size.width, module.size.height);
  
        // 绘制模块的名称
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText(module.name, module.position.x + 10, module.position.y + 20);
      }
    }
  
    // 处理鼠标事件
    function handleMouseMove(e: MouseEvent) {
      if (canvas) {
        const { offsetX, offsetY } = e;
        // 处理 hover 逻辑
        modules.forEach(module => {
          if (offsetX > module.position.x && offsetX < module.position.x + module.size.width &&
            offsetY > module.position.y && offsetY < module.position.y + module.size.height) {
            module.enabled = !module.enabled; // 点击模块切换状态（开/关）
            draw(); // 重绘
          }
        });
      }
    }
  
    // 监听鼠标点击
    $: if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
    }
  
    onDestroy(() => {
      // 清理事件监听
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
      }
    });
  </script>
  
  <canvas bind:this={canvas} class="panel-canvas"></canvas>
  
  <style>
    .panel-canvas {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
    }
  </style>
  