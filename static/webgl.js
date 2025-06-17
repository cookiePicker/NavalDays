window.WebGLApp = (function () {
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext("webgl");

  if (!ctx) {
    alert("WebGL не поддерживается");
    return;
  }

  const vertexShaderSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0, 1);
    }
  `;
  const fragmentShaderSource = `
    void main() {
      gl_FragColor = vec4(1, 0, 0, 1);
    }
  `;

  function compileShader(type, source) {
    const shader = ctx.createShader(type);
    ctx.shaderSource(shader, source);
    ctx.compileShader(shader);
    return shader;
  }

  const vs = compileShader(ctx.VERTEX_SHADER, vertexShaderSource);
  const fs = compileShader(ctx.FRAGMENT_SHADER, fragmentShaderSource);
  const program = ctx.createProgram();
  ctx.attachShader(program, vs);
  ctx.attachShader(program, fs);
  ctx.linkProgram(program);
  ctx.useProgram(program);

  const positionBuffer = ctx.createBuffer();
  const positionLocation = ctx.getAttribLocation(program, "a_position");

  function draw(x, y) {
    const size = 0.2;
    const vertices = new Float32Array([
      x, y,
      x + size, y,
      x, y + size,
      x, y + size,
      x + size, y,
      x + size, y + size
    ]);

    ctx.bindBuffer(ctx.ARRAY_BUFFER, positionBuffer);
    ctx.bufferData(ctx.ARRAY_BUFFER, vertices, ctx.STATIC_DRAW);
    ctx.enableVertexAttribArray(positionLocation);
    ctx.vertexAttribPointer(positionLocation, 2, ctx.FLOAT, false, 0, 0);

    ctx.viewport(0, 0, canvas.width, canvas.height);
    ctx.clearColor(0.2, 0.2, 0.2, 1);
    ctx.clear(ctx.COLOR_BUFFER_BIT);
    ctx.drawArrays(ctx.TRIANGLES, 0, 6);
  }

  return {
    setPosition: function (x, y) {
      draw(x, y);
    }
  };
})();
