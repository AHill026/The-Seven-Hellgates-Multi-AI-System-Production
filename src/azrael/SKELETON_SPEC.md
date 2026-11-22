# Azrael Canonical Skeleton & Socket Specification (72 Bones)

**Source Inspected**: `src/azrael/ProceduralAzraelRig.ts`  
**Verified Bone Count**: `72` (`index 0..71`, Rest Rotation: `[0, 0, 0]` Euler / identity quaternion `[0, 0, 0, 1]`, Scale: `[1, 1, 1]`)  
**Coordinate Convention**: Y-up, Right-Handed, `+Z` forward, `+X` character-left, `-X` character-right, meters (`~2.02m` heroic stature).

---

## 1. Hierarchy Diagram

```text
Root (0)
├── VFX_Root_Bone (71)
└── Hips (1)
    ├── Spine (2)
    │   └── Spine1 (3)
    │       └── Spine2 (4)
    │           ├── Neck (5)
    │           │   └── Head (6)
    │           │       ├── Jaw (7)
    │           │       ├── Eye_L (8)
    │           │       ├── Eye_R (9)
    │           │       ├── Brow_L (41)
    │           │       └── Brow_R (42)
    │           ├── Hood_Crown (10)
    │           │   ├── Hood_Side_L (61)
    │           │   └── Hood_Side_R (62)
    │           ├── Hood_Back (11)
    │           ├── Cloak_Upper (12)
    │           │   └── Cloak_Mid (13)
    │           │       └── Cloak_Lower (14)
    │           │           ├── Cloak_Hem_L (63)
    │           │           └── Cloak_Hem_R (64)
    │           ├── Clavicle_L (15)
    │           │   └── UpperArm_L (16)
    │           │       ├── Pauldron_L (22)
    │           │       └── ForeArm_L (17)
    │           │           ├── Gauntlet_L (51)
    │           │           └── Hand_L (18)
    │           │               ├── Thumb_L (19) ──► ThumbTip_L (65)
    │           │               ├── Index_L (20) ──► IndexTip_L (66)
    │           │               └── Grip_L (21)  ──► GripTip_L (67)
    │           ├── Clavicle_R (23)
    │           │   └── UpperArm_R (24)
    │           │       ├── Pauldron_R (30)
    │           │       └── ForeArm_R (25)
    │           │           ├── Gauntlet_R (52)
    │           │           └── Hand_R (26)  [Socket: Weapon_R]
    │           │               ├── Thumb_R (27) ──► ThumbTip_R (68)
    │           │               ├── Index_R (28) ──► IndexTip_R (69)
    │           │               └── Grip_R (29)  ──► GripTip_R (70)
    │           ├── Scarf_Front (43)
    │           ├── ChestPlate (44)
    │           ├── BackPlate (45)
    │           ├── WingRoot_L (57) ──► WingTip_L (58)   [Reserved / Non-deforming]
    │           └── WingRoot_R (59) ──► WingTip_R (60)   [Reserved / Non-deforming]
    │           [Sockets on Spine2: Weapon_Back, VFX_Chest]
    ├── Thigh_L (31)
    │   └── Shin_L (32)
    │       ├── Greave_L (53)
    │       ├── Knee_L (55)
    │       └── Foot_L (33) ──► Toe_L (34)
    ├── Thigh_R (36)
    │   └── Shin_R (37)
    │       ├── Greave_R (54)
    │       ├── Knee_R (56)
    │       └── Foot_R (38) ──► Toe_R (39)
    ├── Tasset_L (35)
    ├── Tasset_R (40)
    ├── Belt_Center (46)
    ├── Coat_Front_L (47)
    ├── Coat_Front_R (48)
    └── Coat_Back_Upper (49) ──► Coat_Back_Lower (50)
    [Socket on Hips: VFX_Aura]
```

---

## 2. Complete Bone Table (72 Bones)

| Idx | Bone Name | Parent | Local Rest Pos `(x, y, z)` | World Rest Pos `(x, y, z)` | Subsystem | Intended Function |
|---:|---|---|---:|---:|---|---|
| 0 | `Root` | `—` | `(0, 0, 0)` | `(0, 0, 0)` | Core | Ground origin / root motion anchor |
| 1 | `Hips` | `Root` | `(0, 1.03, 0)` | `(0, 1.03, 0)` | Core | Pelvis center of mass; `VFX_Aura` host |
| 2 | `Spine` | `Hips` | `(0, 0.12, 0)` | `(0, 1.15, 0)` | Core | Lower lumbar bend & twist |
| 3 | `Spine1` | `Spine` | `(0, 0.16, 0.01)` | `(0, 1.31, 0.01)` | Core | Mid-torso flexion |
| 4 | `Spine2` | `Spine1` | `(0, 0.17, 0)` | `(0, 1.48, 0.01)` | Core / Weapon | Upper ribcage; hosts `Weapon_Back` & `VFX_Chest` |
| 5 | `Neck` | `Spine2` | `(0, 0.15, 0.01)` | `(0, 1.63, 0.02)` | Core / Head | Neck yaw/pitch |
| 6 | `Head` | `Neck` | `(0, 0.09, 0.01)` | `(0, 1.72, 0.03)` | Facial | Cranium, nose, cheekbones, hair |
| 7 | `Jaw` | `Head` | `(0, 0.02, 0.03)` | `(0, 1.74, 0.06)` | Facial | Square chin & angular jawline articulation |
| 8 | `Eye_L` | `Head` | `(0.034, 0.105, 0.085)` | `(0.034, 1.825, 0.115)` | Facial | Left pale-blue eye look & subtle lid/iris anchor |
| 9 | `Eye_R` | `Head` | `(-0.034, 0.105, 0.085)` | `(-0.034, 1.825, 0.115)` | Facial | Right pale-blue eye look & subtle lid/iris anchor |
| 10 | `Hood_Crown` | `Spine2` | `(0, 0.40, -0.03)` | `(0, 1.88, -0.02)` | Hood | Upper cowl dome; animates between raised & lowered |
| 11 | `Hood_Back` | `Spine2` | `(0, 0.20, -0.12)` | `(0, 1.68, -0.11)` | Hood | Rear hood drape folding onto upper back |
| 12 | `Cloak_Upper` | `Spine2` | `(0, 0.08, -0.16)` | `(0, 1.56, -0.15)` | Cloak | Shoulder cloak root |
| 13 | `Cloak_Mid` | `Cloak_Upper` | `(0, -0.46, -0.07)` | `(0, 1.10, -0.22)` | Cloak | Mid-back tattered cloak bend |
| 14 | `Cloak_Lower` | `Cloak_Mid` | `(0, -0.54, -0.05)` | `(0, 0.56, -0.27)` | Cloak | Lower cloak sweep |
| 15 | `Clavicle_L` | `Spine2` | `(0.08, 0.08, 0)` | `(0.08, 1.56, 0.01)` | Weapon / Arm L | Left shoulder girdle & IK protraction assist |
| 16 | `UpperArm_L` | `Clavicle_L` | `(0.15, -0.02, -0.01)` | `(0.23, 1.54, 0)` | Weapon / Arm L | Left upper arm (Two-Bone IK root) |
| 17 | `ForeArm_L` | `UpperArm_L` | `(0.07, -0.30, 0.01)` | `(0.30, 1.24, 0.01)` | Weapon / Arm L | Left elbow hinge (Two-Bone IK mid-joint) |
| 18 | `Hand_L` | `ForeArm_L` | `(0.05, -0.28, 0.03)` | `(0.35, 0.96, 0.04)` | Weapon / Arm L | Left wrist (Two-Bone IK end-effector) |
| 19 | `Thumb_L` | `Hand_L` | `(-0.01, -0.04, 0.04)` | `(0.34, 0.92, 0.08)` | Weapon / Hand L | Simplified thumb base |
| 20 | `Index_L` | `Hand_L` | `(0.01, -0.08, 0.02)` | `(0.36, 0.88, 0.06)` | Weapon / Hand L | Simplified index finger base |
| 21 | `Grip_L` | `Hand_L` | `(0, -0.08, -0.02)` | `(0.35, 0.88, 0.02)` | Weapon / Hand L | Combined 3-finger grip curl base |
| 22 | `Pauldron_L` | `UpperArm_L` | `(0.04, 0.04, 0)` | `(0.27, 1.58, 0)` | Armor | Rigid left shoulder plate mount |
| 23 | `Clavicle_R` | `Spine2` | `(-0.08, 0.08, 0)` | `(-0.08, 1.56, 0.01)` | Weapon / Arm R | Right shoulder girdle |
| 24 | `UpperArm_R` | `Clavicle_R` | `(-0.15, -0.02, -0.01)` | `(-0.23, 1.54, 0)` | Weapon / Arm R | Right upper arm (primary greatsword swing) |
| 25 | `ForeArm_R` | `UpperArm_R` | `(-0.07, -0.30, 0.01)` | `(-0.30, 1.24, 0.01)` | Weapon / Arm R | Right elbow hinge |
| 26 | `Hand_R` | `ForeArm_R` | `(-0.05, -0.28, 0.03)` | `(-0.35, 0.96, 0.04)` | Weapon / Arm R | Right wrist; hosts `Weapon_R` socket |
| 27 | `Thumb_R` | `Hand_R` | `(0.01, -0.04, 0.04)` | `(-0.34, 0.92, 0.08)` | Weapon / Hand R | Simplified thumb base |
| 28 | `Index_R` | `Hand_R` | `(-0.01, -0.08, 0.02)` | `(-0.36, 0.88, 0.06)` | Weapon / Hand R | Simplified index finger base |
| 29 | `Grip_R` | `Hand_R` | `(0, -0.08, -0.02)` | `(-0.35, 0.88, 0.02)` | Weapon / Hand R | Combined 3-finger grip curl base |
| 30 | `Pauldron_R` | `UpperArm_R` | `(-0.04, 0.04, 0)` | `(-0.27, 1.58, 0)` | Armor | Rigid right shoulder plate mount |
| 31 | `Thigh_L` | `Hips` | `(0.115, -0.06, 0)` | `(0.115, 0.97, 0)` | Locomotion | Left hip joint |
| 32 | `Shin_L` | `Thigh_L` | `(0.005, -0.44, 0)` | `(0.12, 0.53, 0)` | Locomotion | Left knee joint |
| 33 | `Foot_L` | `Shin_L` | `(0.005, -0.43, 0)` | `(0.125, 0.10, 0)` | Locomotion | Left ankle joint |
| 34 | `Toe_L` | `Foot_L` | `(0, -0.07, 0.13)` | `(0.125, 0.03, 0.13)` | Locomotion | Left sabaton toe roll |
| 35 | `Tasset_L` | `Hips` | `(0.18, -0.05, 0.02)` | `(0.18, 0.98, 0.02)` | Armor | Rigid left hip thigh plate |
| 36 | `Thigh_R` | `Hips` | `(-0.115, -0.06, 0)` | `(-0.115, 0.97, 0)` | Locomotion | Right hip joint |
| 37 | `Shin_R` | `Thigh_R` | `(-0.005, -0.44, 0)` | `(-0.12, 0.53, 0)` | Locomotion | Right knee joint |
| 38 | `Foot_R` | `Shin_R` | `(-0.005, -0.43, 0)` | `(-0.125, 0.10, 0)` | Locomotion | Right ankle joint |
| 39 | `Toe_R` | `Foot_R` | `(0, -0.07, 0.13)` | `(-0.125, 0.03, 0.13)` | Locomotion | Right sabaton toe roll |
| 40 | `Tasset_R` | `Hips` | `(-0.18, -0.05, 0.02)` | `(-0.18, 0.98, 0.02)` | Armor | Rigid right hip thigh plate |
| 41 | `Brow_L` | `Head` | `(0.038, 0.135, 0.09)` | `(0.038, 1.855, 0.12)` | Facial | Left pronounced brow expression anchor |
| 42 | `Brow_R` | `Head` | `(-0.038, 0.135, 0.09)` | `(-0.038, 1.855, 0.12)` | Facial | Right pronounced brow expression anchor |
| 43 | `Scarf_Front` | `Spine2` | `(0, 0.09, 0.10)` | `(0, 1.57, 0.11)` | Armor / Cloth | Collar gorget wrap |
| 44 | `ChestPlate` | `Spine2` | `(0, -0.02, 0.10)` | `(0, 1.46, 0.11)` | Armor | Rigid breastplate offset |
| 45 | `BackPlate` | `Spine2` | `(0, 0, -0.11)` | `(0, 1.48, -0.10)` | Armor | Rigid dorsal armor plate |
| 46 | `Belt_Center` | `Hips` | `(0, 0.04, 0.11)` | `(0, 1.07, 0.11)` | Armor | Waist armor buckle |
| 47 | `Coat_Front_L` | `Hips` | `(0.10, -0.11, 0.10)` | `(0.10, 0.92, 0.10)` | Cloak / Skirt | Left front tattered coat panel |
| 48 | `Coat_Front_R` | `Hips` | `(-0.10, -0.11, 0.10)` | `(-0.10, 0.92, 0.10)` | Cloak / Skirt | Right front tattered coat panel |
| 49 | `Coat_Back_Upper` | `Hips` | `(0, -0.09, -0.11)` | `(0, 0.94, -0.11)` | Cloak / Skirt | Rear lower-coat upper panel |
| 50 | `Coat_Back_Lower` | `Coat_Back_Upper` | `(0, -0.39, -0.03)` | `(0, 0.55, -0.14)` | Cloak / Skirt | Rear lower-coat hem |
| 51 | `Gauntlet_L` | `ForeArm_L` | `(0.03, -0.16, 0.02)` | `(0.33, 1.08, 0.03)` | Armor | Rigid left vambrace armor |
| 52 | `Gauntlet_R` | `ForeArm_R` | `(-0.03, -0.16, 0.02)` | `(-0.33, 1.08, 0.03)` | Armor | Rigid right vambrace armor |
| 53 | `Greave_L` | `Shin_L` | `(0, -0.23, 0.03)` | `(0.12, 0.30, 0.03)` | Armor | Rigid left shin greave |
| 54 | `Greave_R` | `Shin_R` | `(0, -0.23, 0.03)` | `(-0.12, 0.30, 0.03)` | Armor | Rigid right shin greave |
| 55 | `Knee_L` | `Shin_L` | `(0, 0.01, 0.06)` | `(0.12, 0.54, 0.06)` | Armor | Left poleyn knee cop |
| 56 | `Knee_R` | `Shin_R` | `(0, 0.01, 0.06)` | `(-0.12, 0.54, 0.06)` | Armor | Right poleyn knee cop |
| 57 | `WingRoot_L` | `Spine2` | `(0.09, 0.04, -0.13)` | `(0.09, 1.52, -0.12)` | Reserved | Reserved spectral/transform dorsal wing root L |
| 58 | `WingTip_L` | `WingRoot_L` | `(0.13, 0.14, -0.06)` | `(0.22, 1.66, -0.18)` | Reserved | Reserved dorsal wing tip L |
| 59 | `WingRoot_R` | `Spine2` | `(-0.09, 0.04, -0.13)` | `(-0.09, 1.52, -0.12)` | Reserved | Reserved dorsal wing root R |
| 60 | `WingTip_R` | `WingRoot_R` | `(-0.13, 0.14, -0.06)` | `(-0.22, 1.66, -0.18)` | Reserved | Reserved dorsal wing tip R |
| 61 | `Hood_Side_L` | `Hood_Crown` | `(0.11, -0.10, 0.05)` | `(0.11, 1.78, 0.03)` | Hood | Left hood lapel fold |
| 62 | `Hood_Side_R` | `Hood_Crown` | `(-0.11, -0.10, 0.05)` | `(-0.11, 1.78, 0.03)` | Hood | Right hood lapel fold |
| 63 | `Cloak_Hem_L` | `Cloak_Lower` | `(0.24, -0.32, -0.01)` | `(0.24, 0.24, -0.28)` | Cloak | Left lateral tattered hem flare |
| 64 | `Cloak_Hem_R` | `Cloak_Lower` | `(-0.24, -0.32, -0.01)` | `(-0.24, 0.24, -0.28)` | Cloak | Right lateral tattered hem flare |
| 65 | `ThumbTip_L` | `Thumb_L` | `(-0.01, -0.03, 0.02)` | `(0.33, 0.89, 0.10)` | Weapon / Hand L | Left thumb tip |
| 66 | `IndexTip_L` | `Index_L` | `(0, -0.04, 0.01)` | `(0.36, 0.84, 0.07)` | Weapon / Hand L | Left index tip |
| 67 | `GripTip_L` | `Grip_L` | `(0, -0.04, 0)` | `(0.35, 0.84, 0.02)` | Weapon / Hand L | Left grip fingers tip |
| 68 | `ThumbTip_R` | `Thumb_R` | `(0.01, -0.03, 0.02)` | `(-0.33, 0.89, 0.10)` | Weapon / Hand R | Right thumb tip |
| 69 | `IndexTip_R` | `Index_R` | `(0, -0.04, 0.01)` | `(-0.36, 0.84, 0.07)` | Weapon / Hand R | Right index tip |
| 70 | `GripTip_R` | `Grip_R` | `(0, -0.04, 0)` | `(-0.35, 0.84, 0.02)` | Weapon / Hand R | Right grip fingers tip |
| 71 | `VFX_Root_Bone` | `Root` | `(0, 0.02, 0)` | `(0, 0.02, 0)` | VFX | Ground VFX anchor |

---

## 3. Attachment Sockets (5 Named Sockets)

| Socket Name | Parent Node | Local Pos `(x, y, z)` | Local Euler XYZ (rad) | World Rest Pos | Purpose |
|---|---|---:|---:|---:|---|
| `Weapon_R` | `Hand_R` | `(0, -0.055, 0.025)` | `(1.3195, 0.12, -0.1)` | `(-0.35, 0.905, 0.065)` | Primary right-hand greatsword grip; blade extends `+Y` forward/up along hand tangent |
| `Weapon_Back` | `Spine2` | `(-0.08, -0.05, -0.16)` | `(0.12, 3.1416, -0.62)` | `(-0.08, 1.43, -0.15)` | Diagonal back scabbard mount across upper torso |
| `Weapon_OffhandGrip` | `Azrael_CeremonialGreatsword` | `(0, -0.15, 0)` | `(0, 0, 0)` | `(-0.3649, 0.8661, -0.0791)` | Secondary lower-hilt grip target solved by `AzraelIKController` |
| `VFX_Chest` | `Spine2` | `(0, 0, 0.15)` | `(0, 0, 0)` | `(0, 1.48, 0.16)` | Sternum chest rune emissive halo anchor |
| `VFX_Aura` | `Hips` | `(0, -0.10, 0)` | `(0, 0, 0)` | `(0, 0.93, 0)` | Character-wide transformation aura & rising particle emitter anchor |

---

## 4. Blender Compatibility & Structural Audit Notes

1. **Reproducibility in Blender**: All 72 bones use standard single-root (`Root -> Hips`) hierarchical transforms, zero non-uniform scale, and clean `Right / Left` (`_R` / `_L`) naming conventions recognized directly by Blender glTF 2.0 export (`gltfScene`). Socket empties (`Weapon_R`, `Weapon_Back`, `VFX_Chest`, `VFX_Aura`) parent cleanly to `Hand_R`, `Spine2`, and `Hips`, while `Weapon_OffhandGrip` lives on the greatsword hierarchy.
2. **Identified Articulation Gaps (Documented, Not Padded)**:
   - **Forearm Twist (`ForeArmTwist_L/R`)**: Not present in the 72-bone procedural mannequin; rigid vambrace/gauntlet armor masks wrist twist in the placeholder, though adding 1 twist bone per forearm during Blender skinning may improve bare wrist/cloth twist if exposed.
   - **Hood Parent Coupling**: `Hood_Crown` and `Hood_Back` are parented to `Spine2` rather than `Head`, which allows lowering the hood cleanly onto the upper back; when raised during sharp `Head` yaw turns (`>25°`), Blender rigs should either blend a small head-follow constraint on `Hood_Crown` or widen the cowl opening so the face never clips the side folds.
   - **Wing Bones (`WingRoot_L/R`, `WingTip_L/R`)**: Present in the 72-bone skeleton as non-deforming placeholders reserved for future major transformation visuals.
   - **Cloak Lateral Width**: `Cloak_Upper -> Cloak_Mid -> Cloak_Lower` handles longitudinal drape cleanly; `Cloak_Hem_L/R` are child bones of `Cloak_Lower` and should receive subtle counter-rotation during sprint/dodge turns in Blender clips.
