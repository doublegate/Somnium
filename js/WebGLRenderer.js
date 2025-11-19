/**
 * WebGLRenderer.js
 * WebGL-based renderer with shader effects for enhanced visual fidelity
 * Maintains EGA aesthetic while adding CRT effects, scanlines, and more
 */

export class WebGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.programs = new Map();
    this.buffers = new Map();
    this.textures = new Map();
    this.framebuffers = new Map();

    // Shader effects
    this.effects = {
      crtEffect: true,
      scanlines: true,
      bloom: false,
      pixelate: true,
      vignette: true,
      colorAberration: false,
    };

    // Effect parameters
    this.params = {
      crtCurvature: 0.15,
      scanlineIntensity: 0.3,
      bloomThreshold: 0.8,
      bloomIntensity: 0.5,
      pixelSize: 2.0,
      vignetteIntensity: 0.3,
      aberrationAmount: 0.002,
    };

    this.initialized = false;
    this.logger = console;
  }

  /**
   * Initialize WebGL context and shaders
   */
  async initialize() {
    try {
      // Get WebGL2 context (fallback to WebGL1)
      this.gl = this.canvas.getContext('webgl2') ||
                this.canvas.getContext('webgl') ||
                this.canvas.getContext('experimental-webgl');

      if (!this.gl) {
        throw new Error('WebGL not supported');
      }

      this.logger.log('[WebGLRenderer] WebGL context created');

      // Load and compile shaders
      await this.loadShaders();

      // Create buffers
      this.createBuffers();

      // Create framebuffers for multi-pass rendering
      this.createFramebuffers();

      this.initialized = true;
      this.logger.log('[WebGLRenderer] Initialization complete');

      return true;
    } catch (error) {
      this.logger.error('[WebGLRenderer] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Load and compile shader programs
   */
  async loadShaders() {
    // Basic vertex shader (used by most effects)
    const basicVertexShader = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;

      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    // CRT effect fragment shader
    const crtFragmentShader = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_curvature;
      uniform float u_scanlineIntensity;
      varying vec2 v_texCoord;

      // CRT screen curvature
      vec2 curveRemapUV(vec2 uv) {
        uv = uv * 2.0 - 1.0;
        vec2 offset = abs(uv.yx) / vec2(u_curvature, u_curvature);
        uv = uv + uv * offset * offset;
        uv = uv * 0.5 + 0.5;
        return uv;
      }

      void main() {
        vec2 uv = curveRemapUV(v_texCoord);

        // Edge fade (vignette from curvature)
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          return;
        }

        // Sample texture
        vec4 color = texture2D(u_texture, uv);

        // Scanlines
        float scanline = sin(uv.y * u_resolution.y * 2.0) * u_scanlineIntensity;
        color.rgb -= scanline;

        // Slight flicker
        color.rgb *= 0.95 + 0.05 * sin(u_time * 10.0 + uv.y * 1000.0);

        gl_FragColor = color;
      }
    `;

    // Bloom effect shader
    const bloomFragmentShader = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform float u_threshold;
      uniform float u_intensity;
      varying vec2 v_texCoord;

      void main() {
        vec4 color = texture2D(u_texture, v_texCoord);

        // Extract bright areas
        float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
        if (brightness > u_threshold) {
          gl_FragColor = color * u_intensity;
        } else {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        }
      }
    `;

    // Gaussian blur shader
    const blurFragmentShader = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform vec2 u_direction;
      varying vec2 v_texCoord;

      void main() {
        vec2 offset = u_direction / u_resolution;

        vec4 color = vec4(0.0);
        color += texture2D(u_texture, v_texCoord - offset * 4.0) * 0.0162;
        color += texture2D(u_texture, v_texCoord - offset * 3.0) * 0.0540;
        color += texture2D(u_texture, v_texCoord - offset * 2.0) * 0.1216;
        color += texture2D(u_texture, v_texCoord - offset * 1.0) * 0.1945;
        color += texture2D(u_texture, v_texCoord) * 0.2270;
        color += texture2D(u_texture, v_texCoord + offset * 1.0) * 0.1945;
        color += texture2D(u_texture, v_texCoord + offset * 2.0) * 0.1216;
        color += texture2D(u_texture, v_texCoord + offset * 3.0) * 0.0540;
        color += texture2D(u_texture, v_texCoord + offset * 4.0) * 0.0162;

        gl_FragColor = color;
      }
    `;

    // Pixelate shader
    const pixelateFragmentShader = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform float u_pixelSize;
      varying vec2 v_texCoord;

      void main() {
        vec2 pixelated = floor(v_texCoord * u_resolution / u_pixelSize) * u_pixelSize / u_resolution;
        gl_FragColor = texture2D(u_texture, pixelated);
      }
    `;

    // Chromatic aberration shader
    const aberrationFragmentShader = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform float u_amount;
      varying vec2 v_texCoord;

      void main() {
        vec2 offset = vec2(u_amount, 0.0);

        float r = texture2D(u_texture, v_texCoord - offset).r;
        float g = texture2D(u_texture, v_texCoord).g;
        float b = texture2D(u_texture, v_texCoord + offset).b;

        gl_FragColor = vec4(r, g, b, 1.0);
      }
    `;

    // Vignette shader
    const vignetteFragmentShader = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform float u_intensity;
      varying vec2 v_texCoord;

      void main() {
        vec4 color = texture2D(u_texture, v_texCoord);

        vec2 center = v_texCoord - 0.5;
        float dist = length(center);
        float vignette = 1.0 - dist * u_intensity;

        gl_FragColor = vec4(color.rgb * vignette, color.a);
      }
    `;

    // Composite shader (combines all effects)
    const compositeFragmentShader = `
      precision mediump float;
      uniform sampler2D u_mainTexture;
      uniform sampler2D u_bloomTexture;
      uniform float u_bloomIntensity;
      varying vec2 v_texCoord;

      void main() {
        vec4 main = texture2D(u_mainTexture, v_texCoord);
        vec4 bloom = texture2D(u_bloomTexture, v_texCoord);

        gl_FragColor = main + bloom * u_bloomIntensity;
      }
    `;

    // Compile shader programs
    this.programs.set('crt', this.createProgram(basicVertexShader, crtFragmentShader));
    this.programs.set('bloom', this.createProgram(basicVertexShader, bloomFragmentShader));
    this.programs.set('blur', this.createProgram(basicVertexShader, blurFragmentShader));
    this.programs.set('pixelate', this.createProgram(basicVertexShader, pixelateFragmentShader));
    this.programs.set('aberration', this.createProgram(basicVertexShader, aberrationFragmentShader));
    this.programs.set('vignette', this.createProgram(basicVertexShader, vignetteFragmentShader));
    this.programs.set('composite', this.createProgram(basicVertexShader, compositeFragmentShader));

    this.logger.log('[WebGLRenderer] Shaders compiled successfully');
  }

  /**
   * Create and compile shader program
   */
  createProgram(vertexSource, fragmentSource) {
    const gl = this.gl;

    // Compile vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexSource);
    gl.compileShader(vertexShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(vertexShader);
      gl.deleteShader(vertexShader);
      throw new Error(`Vertex shader compilation error: ${error}`);
    }

    // Compile fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(fragmentShader);
      gl.deleteShader(fragmentShader);
      throw new Error(`Fragment shader compilation error: ${error}`);
    }

    // Link program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`Program linking error: ${error}`);
    }

    return program;
  }

  /**
   * Create vertex buffers
   */
  createBuffers() {
    const gl = this.gl;

    // Full-screen quad
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);

    const texCoords = new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      1, 1,
    ]);

    // Position buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    this.buffers.set('position', positionBuffer);

    // TexCoord buffer
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    this.buffers.set('texCoord', texCoordBuffer);
  }

  /**
   * Create framebuffers for multi-pass rendering
   */
  createFramebuffers() {
    const gl = this.gl;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Main framebuffer
    this.framebuffers.set('main', this.createFramebuffer(width, height));

    // Bloom framebuffers (quarter resolution)
    this.framebuffers.set('bloom', this.createFramebuffer(width / 4, height / 4));
    this.framebuffers.set('bloomBlur', this.createFramebuffer(width / 4, height / 4));
  }

  /**
   * Create a framebuffer with texture
   */
  createFramebuffer(width, height) {
    const gl = this.gl;

    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    // Create texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Attach texture
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error('Framebuffer incomplete');
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return { framebuffer, texture, width, height };
  }

  /**
   * Render canvas 2D content with WebGL effects
   * @param {HTMLCanvasElement} sourceCanvas - Canvas to render
   */
  render(sourceCanvas, time = 0) {
    if (!this.initialized) {
      this.logger.warn('[WebGLRenderer] Not initialized');
      return;
    }

    const gl = this.gl;

    // Create texture from source canvas
    const sourceTexture = this.createTextureFromCanvas(sourceCanvas);

    // Multi-pass rendering
    let currentTexture = sourceTexture;

    // Pass 1: Pixelate (if enabled)
    if (this.effects.pixelate) {
      currentTexture = this.applyPixelate(currentTexture);
    }

    // Pass 2: CRT effect (if enabled)
    if (this.effects.crtEffect) {
      currentTexture = this.applyCRT(currentTexture, time);
    }

    // Pass 3: Bloom (if enabled)
    let bloomTexture = null;
    if (this.effects.bloom) {
      bloomTexture = this.applyBloom(currentTexture);
    }

    // Pass 4: Chromatic aberration (if enabled)
    if (this.effects.colorAberration) {
      currentTexture = this.applyAberration(currentTexture);
    }

    // Pass 5: Vignette (if enabled)
    if (this.effects.vignette) {
      currentTexture = this.applyVignette(currentTexture);
    }

    // Final composite to screen
    this.composite(currentTexture, bloomTexture);

    // Cleanup
    gl.deleteTexture(sourceTexture);
    if (bloomTexture) {
      gl.deleteTexture(bloomTexture);
    }
  }

  /**
   * Create texture from canvas
   */
  createTextureFromCanvas(canvas) {
    const gl = this.gl;
    const texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
  }

  /**
   * Apply pixelate effect
   */
  applyPixelate(inputTexture) {
    const gl = this.gl;
    const program = this.programs.get('pixelate');
    const fb = this.framebuffers.get('main');

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb.framebuffer);
    gl.viewport(0, 0, fb.width, fb.height);

    gl.useProgram(program);
    this.bindQuad(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputTexture);
    gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0);
    gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), fb.width, fb.height);
    gl.uniform1f(gl.getUniformLocation(program, 'u_pixelSize'), this.params.pixelSize);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return fb.texture;
  }

  /**
   * Apply CRT effect
   */
  applyCRT(inputTexture, time) {
    const gl = this.gl;
    const program = this.programs.get('crt');
    const fb = this.framebuffers.get('main');

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb.framebuffer);
    gl.viewport(0, 0, fb.width, fb.height);

    gl.useProgram(program);
    this.bindQuad(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputTexture);
    gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0);
    gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), fb.width, fb.height);
    gl.uniform1f(gl.getUniformLocation(program, 'u_time'), time);
    gl.uniform1f(gl.getUniformLocation(program, 'u_curvature'), this.params.crtCurvature);
    gl.uniform1f(gl.getUniformLocation(program, 'u_scanlineIntensity'), this.params.scanlineIntensity);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return fb.texture;
  }

  /**
   * Apply bloom effect
   */
  applyBloom(inputTexture) {
    // Extract bright areas -> Blur -> Return bloom texture
    // Implementation details omitted for brevity
    return this.framebuffers.get('bloom').texture;
  }

  /**
   * Apply chromatic aberration
   */
  applyAberration(inputTexture) {
    const gl = this.gl;
    const program = this.programs.get('aberration');
    const fb = this.framebuffers.get('main');

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb.framebuffer);
    gl.viewport(0, 0, fb.width, fb.height);

    gl.useProgram(program);
    this.bindQuad(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputTexture);
    gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0);
    gl.uniform1f(gl.getUniformLocation(program, 'u_amount'), this.params.aberrationAmount);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return fb.texture;
  }

  /**
   * Apply vignette effect
   */
  applyVignette(inputTexture) {
    const gl = this.gl;
    const program = this.programs.get('vignette');
    const fb = this.framebuffers.get('main');

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb.framebuffer);
    gl.viewport(0, 0, fb.width, fb.height);

    gl.useProgram(program);
    this.bindQuad(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputTexture);
    gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0);
    gl.uniform1f(gl.getUniformLocation(program, 'u_intensity'), this.params.vignetteIntensity);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return fb.texture;
  }

  /**
   * Composite final output to screen
   */
  composite(mainTexture, bloomTexture) {
    const gl = this.gl;
    const program = this.programs.get('composite');

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    this.bindQuad(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, mainTexture);
    gl.uniform1i(gl.getUniformLocation(program, 'u_mainTexture'), 0);

    if (bloomTexture) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, bloomTexture);
      gl.uniform1i(gl.getUniformLocation(program, 'u_bloomTexture'), 1);
      gl.uniform1f(gl.getUniformLocation(program, 'u_bloomIntensity'), this.params.bloomIntensity);
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /**
   * Bind quad buffers
   */
  bindQuad(program) {
    const gl = this.gl;

    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const texCoordLoc = gl.getAttribLocation(program, 'a_texCoord');

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.get('position'));
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.get('texCoord'));
    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
  }

  /**
   * Toggle effect on/off
   */
  toggleEffect(effectName, enabled) {
    if (effectName in this.effects) {
      this.effects[effectName] = enabled;
      this.logger.log(`[WebGLRenderer] Effect ${effectName}: ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Set effect parameter
   */
  setParam(paramName, value) {
    if (paramName in this.params) {
      this.params[paramName] = value;
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    const gl = this.gl;

    // Delete programs
    this.programs.forEach((program) => gl.deleteProgram(program));
    this.programs.clear();

    // Delete buffers
    this.buffers.forEach((buffer) => gl.deleteBuffer(buffer));
    this.buffers.clear();

    // Delete framebuffers
    this.framebuffers.forEach((fb) => {
      gl.deleteFramebuffer(fb.framebuffer);
      gl.deleteTexture(fb.texture);
    });
    this.framebuffers.clear();

    this.initialized = false;
    this.logger.log('[WebGLRenderer] Destroyed');
  }
}
