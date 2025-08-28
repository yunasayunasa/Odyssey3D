// src/scenes/VoxelScene.js (最終・クリーンアップ版)
// ★★★ ここで、ファイル全体で使うクラスを一度だけ定義する ★★★
const BABYLON = window.BABYLON;
const CANNON = window.CANNON;
const Scene = BABYLON.Scene, Engine = BABYLON.Engine, SceneLoader = BABYLON.SceneLoader;
const ArcRotateCamera = BABYLON.ArcRotateCamera, Vector3 = BABYLON.Vector3;
const HemisphericLight = BABYLON.HemisphericLight, Color4 = BABYLON.Color4;
const CannonJSPlugin = BABYLON.CannonJSPlugin, PhysicsImpostor = BABYLON.PhysicsImpostor;
const Quaternion = BABYLON.Quaternion, Scalar = BABYLON.Scalar, Ray = BABYLON.Ray;
// Babylon.jsのクラスをグローバルから取得


export default class VoxelScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VoxelScene' });

        // プロパティを初期化
        this.bjs_engine = null;
        this.bjs_scene = null;
        this.stageKey = 'stage_01_tutorial';
        this.player = null;
        this.cursors = null;
        this.animations = {}; 
    }
    
    init(data) {
        if (data && data.stageKey) {
            this.stageKey = data.stageKey;
        }
    }

    async create() {
        console.log("VoxelScene: create - 3Dシーンの構築を開始します。");
        await this.waitForBabylon();

       
        // --- レイヤー管理 ---
        const phaserContainer = document.getElementById('phaser-container');
        const bjsCanvasNode = document.getElementById('babylon-canvas');
        phaserContainer.style.display = 'none';
        bjsCanvasNode.style.display = 'block';
        
        // --- Babylon.jsの基本設定 ---
        this.bjs_engine = new Engine(bjsCanvasNode, true);
        this.bjs_scene = new Scene(this.bjs_engine);
        this.bjs_scene.clearColor = new Color4(0.1, 0.1, 0.2, 1);

      //  const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 30, new Vector3(0, 5, 0));
         // 1. FollowCamera を生成
    const camera = new BABYLON.FollowCamera("FollowCam", new Vector3(0, 10, -10), this.bjs_scene);

    // 2. カメラの追従パラメータを設定
    camera.radius = 15; // キャラクターからの距離
    camera.heightOffset = 8; // キャラクターの頭上からの高さ
    camera.rotationOffset = 0; // キャラクターの真後ろからの角度 (0 = 真後ろ)
    camera.cameraAcceleration = 0.05; // カメラの追従の滑らかさ
    camera.maxCameraSpeed = 10; // カメラの最大移動速度

        camera.attachControl(bjsCanvasNode, true);
        camera.inputs.remove(camera.inputs.attached.keyboard); // ★ カメラのキーボード操作を無効化
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.bjs_scene);

        // --- 物理エンジンのセットアップ ---
        const cannonPlugin = new CannonJSPlugin(true, 10, CANNON);
        this.bjs_scene.enablePhysics(new Vector3(0, -9.81, 0), cannonPlugin);

        // --- ステージとモデルのロード ---
        const assetDefine = this.cache.json.get('asset_define');
        const stageData = assetDefine.stages[this.stageKey];
        if (!stageData) { return; }

        console.log(`VoxelScene: ステージ「${stageData.name}」のモデルをロードします...`);
        for (const obj of stageData.objects) {
            const modelKey = obj.key;
            const modelPath = assetDefine.models[modelKey];
            if (!modelPath) { continue; }
            
            try {
                const result = await SceneLoader.ImportMeshAsync(null, modelPath.rootUrl, modelPath.fileName, this.bjs_scene);
                const rootNode = result.meshes[0];
                const childMeshes = rootNode.getChildMeshes();
                if (childMeshes.length === 0) {
                    rootNode.dispose();
                    continue;
                }
                const mainMesh = childMeshes[0];

                mainMesh.setParent(null);
                
                mainMesh.name = obj.name;
                mainMesh.position = new Vector3(obj.position.x, obj.position.y, obj.position.z);
                if (obj.scale) {
                    mainMesh.scaling = new Vector3(obj.scale.x, obj.scale.y, obj.scale.z);
                }
                mainMesh.rotationQuaternion = Quaternion.Identity();

                if (obj.key === 'ground_basic') {
                    mainMesh.physicsImpostor = new PhysicsImpostor(mainMesh, PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.5 }, this.bjs_scene);
                } else if (obj.key === 'player_borntest') {
                    mainMesh.physicsImpostor = new PhysicsImpostor(mainMesh, PhysicsImpostor.BoxImpostor, { mass: 1, friction: 0.5 }, this.bjs_scene);
                    this.player = mainMesh; 
                         camera.lockedTarget = this.player; // ★ カメラの追従ターゲットをプレイヤーに設定
                    this.player.physicsImpostor.physicsBody.angularDamping = 1.0;
                    
                    if (result.animationGroups.length > 0) {
                        result.animationGroups.forEach(ag => ag.stop());
                        for (const ag of result.animationGroups) {
                            this.animations[ag.name] = ag;
                        }
                        const animationGroup = result.animationGroups[0];
                        const targetedAnimation = animationGroup.targetedAnimations[0];
                        if (targetedAnimation) {
                           animationGroup.removeTargetedAnimation(targetedAnimation.animation);
                           animationGroup.addTargetedAnimation(targetedAnimation.animation, mainMesh);
                        }
                    }
                }
                
                rootNode.dispose();
                for (let i = 1; i < childMeshes.length; i++) {
                    childMeshes[i].dispose();
                }
            } catch (error) {
                console.error(`モデル[${modelKey}]のロードまたは設定中にエラーが発生しました。`, error);
            }
        }

        // --- 入力設定 ---
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-SPACE', this.playerJump, this);

        // --- レンダリングループ開始 ---
        this.bjs_engine.runRenderLoop(() => {
            if (this.bjs_scene) this.bjs_scene.render();
        });

        // --- Odyssey Engineとの契約遵守 ---
        this.scale.on('resize', this.resize, this);
        this.events.emit('scene-ready');
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.get('SystemScene').events.emit('return-to-novel', { from: 'VoxelScene' });
        });
    }

    waitForBabylon() {
        return new Promise(resolve => {
            const check = () => {
                if (window.BABYLON && window.CANNON) {
                    console.log("Babylon.js and Cannon.js are loaded.");
                    resolve();
                } else {
                    setTimeout(check, 100); 
                }
            };
            check();
        });
    }

    resize(gameSize) {
        if (this.bjs_engine) this.bjs_engine.resize();
    }
    
    isGrounded() {
        if (!this.player) return false;
        const origin = this.player.position;
        const ray = new Ray(origin, new Vector3(0, -1, 0), this.player.getBoundingInfo().boundingBox.extendSize.y + 0.2);
        const hit = this.bjs_scene.pickWithRay(ray, (mesh) => mesh.name === "ground");
        return hit.hit;
    }
    
    playerJump() {
        if (!this.player || !this.player.physicsImpostor) return;
        if (this.isGrounded()) {
            this.player.physicsImpostor.wakeUp();
            this.player.physicsImpostor.applyImpulse(
                new Vector3(0, 15, 0),
                this.player.getAbsolutePosition()
            );
        }
    }
    
    update(time, delta) {
        if (!this.player || !this.player.physicsImpostor) return;
        
        const speed = 5;
        const velocity = this.player.physicsImpostor.getLinearVelocity();
        const camera = this.bjs_scene.activeCamera;
        
        const cameraForward = camera.getForwardRay(1).direction;
        const cameraRight = BABYLON.Vector3.Cross(Vector3.Up(), cameraForward).normalize();
        cameraForward.y = 0;
        cameraRight.y = 0;

        let moveDirection = Vector3.Zero();
        if (this.cursors.left.isDown)  moveDirection.addInPlace(cameraRight.scale(-1));
        if (this.cursors.right.isDown) moveDirection.addInPlace(cameraRight);
        if (this.cursors.up.isDown)    moveDirection.addInPlace(cameraForward);
        if (this.cursors.down.isDown)  moveDirection.addInPlace(cameraForward.scale(-1));

        let currentAnimName = 'idle';
        const newVelocity = new Vector3(0, velocity.y, 0);

        if (moveDirection.length() > 0.1) {
            currentAnimName = this.isGrounded() ? 'run' : 'jump';
            moveDirection.normalize();
            const finalMove = moveDirection.scale(speed);
            newVelocity.x = finalMove.x;
            newVelocity.z = finalMove.z;

            const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
            const currentRotation = this.player.rotation.y;
            this.player.rotation.y = Scalar.Lerp(currentRotation, targetRotation, 0.2);
            
        } else {
            currentAnimName = this.isGrounded() ? 'idle' : 'jump';
            newVelocity.x = 0;
            newVelocity.z = 0;
        }

        const animToPlay = this.animations[currentAnimName] || this.animations['T-pose']; // fallback
        if (animToPlay && !animToPlay.isPlaying) {
            for (const name in this.animations) {
                if (this.animations[name].isPlaying) {
                    this.animations[name].stop();
                }
            }
            animToPlay.play(true);
        }
        
        this.player.physicsImpostor.setLinearVelocity(newVelocity);
    }
   
    shutdown() {
        // ... (以前の、クリーンなshutdownメソッド)
    }
}