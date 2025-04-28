// ResolutionScaler.ts

export interface ResolutionScalerOptions {
    baseResolution: { width: number; height: number };
    minCoeff?: number;
  }
  
  export class ResolutionScaler {
    static subscribe(arg0: (v: any) => void) {
        throw new Error("Method not implemented.");
    }
    private baseResolution: { width: number; height: number };
    private minCoeff: number;
    private scaleFactor: number = 1;
  
    constructor(options: ResolutionScalerOptions) {
      this.baseResolution = options.baseResolution;
      this.minCoeff = options.minCoeff ?? 0.1337;
    }
  
    // 计算调整后的分辨率，保持 16:9 比例
    private calcAdjustedResolution(): { width: number; height: number } {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const aspect = 16 / 9;
      if (w / h > aspect) {
        return { width: h * aspect, height: h };
      } else {
        return { width: w, height: w / aspect };
      }
    }
  
    // 计算分辨率系数
    private calcResolutionCoefficient(): number {
      const { width, height } = this.calcAdjustedResolution();
      const wRatio = width / this.baseResolution.width;
      const hRatio = height / this.baseResolution.height;
      return Math.min(1, Math.max(this.minCoeff, Math.min(wRatio, hRatio)));
    }
  
    // 更新缩放因子
    public updateScaleFactor(): void {
      this.scaleFactor = this.calcResolutionCoefficient();
    }
  
    // 获取当前的缩放因子
    public getScaleFactor(): number {
      return this.scaleFactor;
    }
  
    // 监听窗口大小变化
    public listenResize(callback: () => void): void {
      window.addEventListener("resize", callback);
    }
  
    public removeResizeListener(callback: () => void): void {
      window.removeEventListener("resize", callback);
    }
  }
  