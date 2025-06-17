// webgl.js

function initializeWebGL() {
    // Получаем элемент canvas для рендеринга
    const canvas = document.getElementById("webglCanvas");
    const gl = canvas.getContext("webgl");

    if (!gl) {
        console.error("WebGL не поддерживается в этом браузере.");
        return;
    }

    // Очищаем экран
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Пример простого квадрата
    const vertices = new Float32Array([
        -0.5,  0.5, 0.0,
        -0.5, -0.5, 0.0,
         0.5, -0.5, 0.0,
         0.5,  0.5, 0.0
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Шейдеры
    const vertCode = `
        attribute vec3 coordinates;
        void main(void) {
            gl_Position = vec4(coordinates, 1.0);
        }
    `;
    const fragCode = `
        void main(void) {
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // красный цвет
        }
    `;

    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vertCode);
    gl.compileShader(vertShader);

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fragCode);
    gl.compileShader(fragShader);

    // Создаем программу
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    // Привязываем буфер данных к шейдерам
    const coord = gl.getAttribLocation(shaderProgram, "coordinates");
    gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coord);

    // Рисуем квадрат
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}
