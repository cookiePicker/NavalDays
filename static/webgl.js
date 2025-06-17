window.onload = () => {
  const canvas = document.getElementById("glCanvas");
  const gl = canvas.getContext("webgl");
  if (!gl) {
    alert("WebGL не поддерживается");
    return;
  }

  gl.clearColor(0.4, 0.5, 0.5, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
};
