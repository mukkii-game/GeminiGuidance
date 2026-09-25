import { InputState } from '../types';

export class InputManager {
  public state: InputState = {
    x: 180,
    y: 440,
    active: false,
    isTouch: false,
    crtTogglePressed: false,
    audioTogglePressed: false,
  };

  private canvas: HTMLCanvasElement;
  private lastTouchX: number = 0;
  private lastTouchY: number = 0;
  private keysDown: Set<string> = new Set();

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
      }
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
}
