<script lang="ts">
    import { onMount } from 'svelte';
    import { get } from 'svelte/store';

    export let fragSrc: string;
  
    let canvas: HTMLCanvasElement;
    const vertSrc = `#version 300 es
    in vec2 a_position;
    out vec2 v_uv;
    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }`;
  
    function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) || 'Unknown shader error');
      }
      return shader;
    }
  
    function createProgram(gl: WebGL2RenderingContext, vSrc: string, fSrc: string) {
      const vShader = createShader(gl, gl.VERTEX_SHADER, vSrc);
      const fShader = createShader(gl, gl.FRAGMENT_SHADER, fSrc);
      const program = gl.createProgram()!;
      gl.attachShader(program, vShader);
      gl.attachShader(program, fShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'Program link error');
      }
      return program;
    }
  
    onMount(() => {
       
      const gl = canvas.getContext('webgl2');
      if (!gl) {
        console.error('WebGL2 not supported');
        return;
      }
  
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
  
      const vertices = new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1
      ]);
      const buffer = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  
      const program = createProgram(gl, vertSrc, fragSrc);
      gl.useProgram(program);
  
      const posLoc = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  
      const uResolution = gl.getUniformLocation(program, 'u_resolution')!;
      const uTime = gl.getUniformLocation(program, 'u_time')!;
  
      const start = performance.now();
      function render(now: number) {
        const time = (now - start) * 0.001;
        gl.uniform2f(uResolution, width, height);
        gl.uniform1f(uTime, time);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    });
  </script>
  
  <canvas bind:this={canvas}></canvas>
  
  <style>
    canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 0;
      display: block;
    }
  </style>
  