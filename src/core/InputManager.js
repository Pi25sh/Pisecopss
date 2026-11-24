/**
 * InputManager - Handles keyboard, mouse look, pointer lock, and interaction triggers.
 */

export class InputManager {
  constructor(domElement) {
    this.domElement = domElement;
    this.keys = {};
    this.mouse = {
      deltaX: 0,
      deltaY: 0,
      isLocked: false,
      isRightDown: false,
      isLeftDown: false
    };

    this.onInteract = null;    // Triggered on F or E
    this.onTogglePhone = null;  // Triggered on M or Tab
    this.onTogglePause = null;  // Triggered on Esc
    this.onHonk = null;         // Triggered on H
    this.onHeadlights = null;   // Triggered on L

    this.init();
  }

  init() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));

    this.domElement.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.isLeftDown = true;
        this.requestPointerLock();
      } else if (e.button === 2) {
        this.mouse.isRightDown = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.isLeftDown = false;
      if (e.button === 2) this.mouse.isRightDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.mouse.isLocked || this.mouse.isRightDown || this.mouse.isLeftDown) {
        this.mouse.deltaX += e.movementX || 0;
        this.mouse.deltaY += e.movementY || 0;
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.mouse.isLocked = document.pointerLockElement === this.domElement;
    });

    // Prevent context menu on right click for free camera look
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  requestPointerLock() {
    if (document.pointerLockElement !== this.domElement) {
      this.domElement.requestPointerLock?.();
    }
  }

  exitPointerLock() {
    if (document.pointerLockElement === this.domElement) {
      document.exitPointerLock?.();
    }
  }

  handleKeyDown(e) {
    const code = e.code;
    this.keys[code] = true;

    // Trigger one-shot events
    if ((code === 'KeyF' || code === 'KeyE') && this.onInteract) {
      this.onInteract();
    }
    if ((code === 'KeyM' || code === 'Tab') && this.onTogglePhone) {
      e.preventDefault();
      this.onTogglePhone();
    }
    if (code === 'KeyH' && this.onHonk) {
      this.onHonk();
    }
    if (code === 'KeyL' && this.onHeadlights) {
      this.onHeadlights();
    }
    if (code === 'Escape' && this.onTogglePause) {
      this.onTogglePause();
    }
  }

  handleKeyUp(e) {
    this.keys[e.code] = false;
  }

  get forward() {
    return !!(this.keys['KeyW'] || this.keys['ArrowUp']);
  }

  get backward() {
    return !!(this.keys['KeyS'] || this.keys['ArrowDown']);
  }

  get left() {
    return !!(this.keys['KeyA'] || this.keys['ArrowLeft']);
  }

  get right() {
    return !!(this.keys['KeyD'] || this.keys['ArrowRight']);
  }

  get sprint() {
    return !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']);
  }

  get jump() {
    return !!(this.keys['Space']);
  }

  get crouch() {
    return !!(this.keys['KeyC']);
  }

  getMouseDeltas() {
    const dx = this.mouse.deltaX;
    const dy = this.mouse.deltaY;
    this.mouse.deltaX = 0;
    this.mouse.deltaY = 0;
    return { dx, dy };
  }
}
