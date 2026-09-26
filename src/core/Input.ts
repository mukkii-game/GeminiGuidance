import { InputState, PhysicsPresetId } from '../types';

export class InputManager {
  public state: InputState = {
    x: 180,
    y: 440,
    active: false,
    isTouch: false,
    isPointerDown: false,
    crtTogglePressed: false,
    audioTogglePressed: false,
  };

  private canvas: HTMLCanvasElement;
  private lastTouchX: number = 0;
  private lastTouchY: number = 0;
  private keysDown: Set<string> = new Set();
  private lastClick: { x: number; y: number } | null = null;
  private cyclePresetPressed: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupMouseAndTouch();
    this.setupKeyboard();
  }

  private setupMouseAndTouch(): void {
    // Mouse Events
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.state.x = (e.clientX - rect.left) * scaleX;
      this.state.y = (e.clientY - rect.top) * scaleY;
      this.state.active = true;
      this.state.isTouch = false;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.state.active = true;
        this.state.isPointerDown = true;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        this.lastClick = {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY,
        };
      }
    });

    window.addEventListener('mouseup', () => {
      this.state.isPointerDown = false;
    });

    // Right-Click: Toggle Attack Mode (ヨーヨー ⇄ 公転)
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.state.orbitTogglePressed = true;
    });

    // Touch Events: Relative Delta Dragging (Ergonomic 1-finger control)
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        this.lastTouchX = (touch.clientX - rect.left) * scaleX;
        this.lastTouchY = (touch.clientY - rect.top) * scaleY;
        this.state.active = true;
        this.state.isTouch = true;
        this.state.isPointerDown = true;
        this.lastClick = { x: this.lastTouchX, y: this.lastTouchY };
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const currentX = (touch.clientX - rect.left) * scaleX;
        const currentY = (touch.clientY - rect.top) * scaleY;

        const dx = currentX - this.lastTouchX;
        const dy = currentY - this.lastTouchY;

        this.state.x = Math.max(16, Math.min(this.canvas.width - 16, this.state.x + dx));
        this.state.y = Math.max(40, Math.min(this.canvas.height - 24, this.state.y + dy));

        this.lastTouchX = currentX;
        this.lastTouchY = currentY;
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.state.isPointerDown = false;
    }, { passive: false });
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      this.keysDown.add(e.code);
      if (e.code === 'KeyC') {
        this.state.crtTogglePressed = true;
      }
      if (e.code === 'KeyM') {
        this.state.audioTogglePressed = true;
      }
      if (e.code === 'KeyT') {
        this.state.testStageTogglePressed = true;
      }
      if (e.code === 'KeyL') {
        this.state.levelUpPressed = true;
      }
      if (e.code === 'KeyP') {
        this.cyclePresetPressed = true;
      }
      if (e.code === 'Space' || e.code === 'KeyZ' || e.code === 'KeyO') {
        this.state.orbitTogglePressed = true;
      }
      if (e.code === 'Enter') {
        this.state.enterPressed = true;
      }
      if (e.code === 'KeyX') {
        this.state.collisionTogglePressed = true;
      }
      if (e.code === 'Digit1') {
        this.state.presetSelectPressed = 'SNAP_SLING';
      }
      if (e.code === 'Digit2') {
        this.state.presetSelectPressed = 'HYPER_BOOMERANG';
      }
      if (e.code === 'Digit3') {
        this.state.presetSelectPressed = 'GIGANTIC_SPRING';
      }
      if (e.code === 'Digit4') {
        this.state.presetSelectPressed = 'HEAVY_WRECKER';
      }
      if (e.code === 'Digit5') {
        this.state.presetSelectPressed = 'RAPID_ORBIT';
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
    });
  }

  public updateKeyboardMovement(speed: number = 4.5): void {
    let dx = 0;
    let dy = 0;
    if (this.keysDown.has('ArrowLeft') || this.keysDown.has('KeyA')) dx -= 1;
    if (this.keysDown.has('ArrowRight') || this.keysDown.has('KeyD')) dx += 1;
    if (this.keysDown.has('ArrowUp') || this.keysDown.has('KeyW')) dy -= 1;
    if (this.keysDown.has('ArrowDown') || this.keysDown.has('KeyS')) dy += 1;

    if (dx !== 0 || dy !== 0) {
      this.state.active = true;
      const mag = Math.hypot(dx, dy);
      this.state.x = Math.max(16, Math.min(this.canvas.width - 16, this.state.x + (dx / mag) * speed));
      this.state.y = Math.max(40, Math.min(this.canvas.height - 24, this.state.y + (dy / mag) * speed));
    }
  }

  public consumeClick(): { x: number; y: number } | null {
    const click = this.lastClick;
    this.lastClick = null;
    return click;
  }

  public consumeCrtToggle(): boolean {
    const val = !!this.state.crtTogglePressed;
    this.state.crtTogglePressed = false;
    return val;
  }

  public consumeAudioToggle(): boolean {
    const val = !!this.state.audioTogglePressed;
    this.state.audioTogglePressed = false;
    return val;
  }

  public consumeTestStageToggle(): boolean {
    const val = !!this.state.testStageTogglePressed;
    this.state.testStageTogglePressed = false;
    return val;
  }

  public consumeLevelUp(): boolean {
    const val = !!this.state.levelUpPressed;
    this.state.levelUpPressed = false;
    return val;
  }

  public consumeOrbitToggle(): boolean {
    const val = !!this.state.orbitTogglePressed;
    this.state.orbitTogglePressed = false;
    return val;
  }

  public consumeCollisionToggle(): boolean {
    const val = !!this.state.collisionTogglePressed;
    this.state.collisionTogglePressed = false;
    return val;
  }

  public consumeEnter(): boolean {
    const val = !!this.state.enterPressed;
    this.state.enterPressed = false;
    return val;
  }

  public consumePresetSelect(): PhysicsPresetId | 'CYCLE' | null {
    if (this.cyclePresetPressed) {
      this.cyclePresetPressed = false;
      return 'CYCLE';
    }
    const val = this.state.presetSelectPressed || null;
    this.state.presetSelectPressed = undefined;
    return val;
  }
}
