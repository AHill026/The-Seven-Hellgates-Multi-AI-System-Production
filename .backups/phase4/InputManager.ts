/**
 * The Seven Hellgates - Input Manager
 * Handles desktop keyboard/mouse and mobile touch inputs.
 */

export interface InputState {
  moveX: number; // -1 to 1
  moveZ: number; // -1 to 1
  lookX: number; // mouse delta or touch delta
  lookY: number;
  isSprinting: boolean;
  attackLight: boolean;
  attackHeavy: boolean;
  dodge: boolean;
  switchStance: boolean;
  specialAbility: boolean;
  devourSkill: boolean;
  wrathUltimate: boolean;
  manifestWeapon: boolean;
  convergenceUltimate: boolean;
  equipWeaponSlot: number | null; // 1..7
  toggleArsenal: boolean;
  toggleLockOn: boolean;
  pause: boolean;
  unstuck: boolean;
}

export class InputManager {
  public state: InputState = {
    moveX: 0,
    moveZ: 0,
    lookX: 0,
    lookY: 0,
    isSprinting: false,
    attackLight: false,
    attackHeavy: false,
    dodge: false,
    switchStance: false,
    specialAbility: false,
    devourSkill: false,
    wrathUltimate: false,
    manifestWeapon: false,
    convergenceUltimate: false,
    equipWeaponSlot: null,
    toggleArsenal: false,
    toggleLockOn: false,
    pause: false,
    unstuck: false,
  };

  private keysDown: Set<string> = new Set();
  private isPointerDown: boolean = false;
  private lastPointerX: number = 0;
  private lastPointerY: number = 0;

  constructor(targetElement: HTMLElement) {
    this.setupKeyboard();
    this.setupMouse(targetElement);
  }

  private setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keysDown.add(e.code);
      if (e.code === 'KeyQ') this.state.switchStance = true;
      if (e.code === 'KeyE') this.state.specialAbility = true;
      if (e.code === 'KeyF') this.state.devourSkill = true;
      if (e.code === 'KeyR') this.state.wrathUltimate = true;
      if (e.code === 'KeyV') this.state.manifestWeapon = true;
      if (e.code === 'KeyX') this.state.convergenceUltimate = true;
      if (e.code === 'KeyC') this.state.toggleArsenal = true;
      if (e.code === 'KeyU') this.state.unstuck = true;
      if (e.code === 'Space') this.state.dodge = true;

      // Weapon quick-equip hotkeys 1-7
      if (e.code.startsWith('Digit')) {
        const slot = Number(e.code.replace('Digit', ''));
        if (slot >= 1 && slot <= 7) {
          this.state.equipWeaponSlot = slot;
        }
      }

      if (e.code === 'Tab') {
        e.preventDefault();
        this.state.toggleLockOn = true;
      }
      if (e.code === 'Escape') this.state.pause = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
    });
  }

  private setupMouse(targetElement: HTMLElement) {
    targetElement.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.state.attackLight = true;
      } else if (e.button === 2) {
        e.preventDefault();
        this.state.attackHeavy = true;
      }
      this.isPointerDown = true;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isPointerDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isPointerDown) {
        const dx = e.clientX - this.lastPointerX;
        const dy = e.clientY - this.lastPointerY;
        this.state.lookX += dx * 0.004;
        this.state.lookY += dy * 0.004;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
      }
    });

    targetElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // Mobile virtual joystick & buttons injection
  public setVirtualMove(x: number, z: number) {
    this.state.moveX = x;
    this.state.moveZ = z;
  }

  public setVirtualLookDelta(dx: number, dy: number) {
    this.state.lookX += dx;
    this.state.lookY += dy;
  }

  public triggerAction(
    action: 'light' | 'heavy' | 'dodge' | 'stance' | 'ability' | 'wrath' | 'lock' | 'devour' | 'manifest' | 'convergence'
  ) {
    if (action === 'light') this.state.attackLight = true;
    if (action === 'heavy') this.state.attackHeavy = true;
    if (action === 'dodge') this.state.dodge = true;
    if (action === 'stance') this.state.switchStance = true;
    if (action === 'ability') this.state.specialAbility = true;
    if (action === 'devour') this.state.devourSkill = true;
    if (action === 'wrath') this.state.wrathUltimate = true;
    if (action === 'manifest') this.state.manifestWeapon = true;
    if (action === 'convergence') this.state.convergenceUltimate = true;
    if (action === 'lock') this.state.toggleLockOn = true;
  }

  public update(): InputState {
    // Keyboard WASD
    let kx = 0;
    let kz = 0;
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) kx -= 1;
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) kx += 1;
    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) kz += 1;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) kz -= 1;

    // Normalize keyboard vector if moving diagonally
    const len = Math.sqrt(kx * kx + kz * kz);
    if (len > 0) {
      kx /= len;
      kz /= len;
      this.state.moveX = kx;
      this.state.moveZ = kz;
    }

    this.state.isSprinting = this.keysDown.has('ShiftLeft') || this.keysDown.has('ShiftRight');

    const copy = { ...this.state };

    // Reset single-frame action triggers
    this.state.attackLight = false;
    this.state.attackHeavy = false;
    this.state.dodge = false;
    this.state.switchStance = false;
    this.state.specialAbility = false;
    this.state.devourSkill = false;
    this.state.wrathUltimate = false;
    this.state.manifestWeapon = false;
    this.state.convergenceUltimate = false;
    this.state.equipWeaponSlot = null;
    this.state.toggleArsenal = false;
    this.state.toggleLockOn = false;
    this.state.pause = false;
    this.state.unstuck = false;
    this.state.lookX = 0;
    this.state.lookY = 0;

    return copy;
  }
}
