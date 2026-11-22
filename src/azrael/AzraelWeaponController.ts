import * as THREE from 'three';
import {
  AzraelWeaponAttachment,
  LoadedAzraelAsset,
} from './types';

export class AzraelWeaponController {
  private asset: LoadedAzraelAsset;
  private attachment: AzraelWeaponAttachment = 'Weapon_R';

  constructor(asset: LoadedAzraelAsset) {
    this.asset = asset;
    this.attachTo('Weapon_R');
  }

  public attachTo(target: AzraelWeaponAttachment): void {
    this.attachment = target;
    const socket = this.asset.sockets[target];
    if (!socket) return;

    socket.add(this.asset.weaponRoot);

    if (target === 'Weapon_R') {
      this.asset.weaponRoot.position.set(0, 0, 0);
      this.asset.weaponRoot.rotation.set(0, 0, 0);
    } else {
      // Weapon_Back diagonal scabbard orientation
      this.asset.weaponRoot.position.set(0, 0.16, 0);
      this.asset.weaponRoot.rotation.set(0, 0, 0);
    }
    this.asset.weaponRoot.updateMatrixWorld(true);
  }

  public getAttachment(): AzraelWeaponAttachment {
    return this.attachment;
  }

  public isWeaponInHand(): boolean {
    return this.attachment === 'Weapon_R';
  }

  public getOffhandGripWorldPosition(out: THREE.Vector3): THREE.Vector3 {
    this.asset.weaponOffhandGrip.updateMatrixWorld(true);
    return this.asset.weaponOffhandGrip.getWorldPosition(out);
  }

  public getOffhandGripWorldQuaternion(out: THREE.Quaternion): THREE.Quaternion {
    this.asset.weaponOffhandGrip.updateMatrixWorld(true);
    return this.asset.weaponOffhandGrip.getWorldQuaternion(out);
  }
}
