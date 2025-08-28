// src/scenes/VoxelScene.js

// Babylon.jsのクラスをグローバルから取得
const BABYLON = window.BABYLON;
const CANNON = window.CANNON;

export default class VoxelScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VoxelScene' });

        // プロパティを初期化
        this.bjs_engine = null;
        this.bjs_scene = null;
        this.stageKey = 'stage_01_tutorial'; // デフォルトステージキー
        this.player = null;
        this.cursors = null;
    }
    
    init(data) {
        if (data && data.stageKey) {
            this.stageKey = data.stageKey;
        }
    }

    async create() {
        console.log("VoxelScene: create - 3Dシーンの構築を開始します。");
        await this.waitForBabylon();

        const Scene = BABYLON.Scene;
        const Engine = BABYLON.Engine;
        const SceneLoader = BABYLON.SceneLoader;
        const ArcRotateCamera = BABYLON.ArcRotateCamera;
        const Vector3 = BABYLON.Vector3;
        const HemisphericLight = BABYLON.HemisphericLight;
        const Color4 = BABYLON.Color4;
        const CannonJSPlugin = BABYLON.CannonJSPlugin;
        const PhysicsImpostor = BABYLON.PhysicsImpostor;

        // --- レイヤー管理 ---
        const phaserContainer = document.getElementById('phaser-container');
        const bjsCanvasNode = document.getElementById('babylon-canvas');
        phaserContainer.style.display = 'none';
        bjsCanvasNode.style.display = 'block';
        
        // --- Babylon.jsの初期化 ---
        this.bjs_engine = new Engine(bjsCanvasNode, true);
        this.bjs_scene = new Scene(this.bjs_engine);
        this.bjs_scene.clearColor = new Color4(0.1, 0.1, 0.2, 1);

        const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 30, new Vector3(0, 5, 0));
        camera.attachControl(bjsCanvasNode, true, false);
        camera.inputs.remove(camera.inputs.attached.keyboard);
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.bjs_scene);

        // --- 物理エンジンのセットアップ ---
        const cannonPlugin = new CannonJSPlugin(true, 10, CANNON);
        this.bjs_scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), cannonPlugin);

        // --- ステージとモデルのロード ---
        const assetDefine = this.cache.json.get('asset_define');
        const stageData = assetDefine.stages[this.stageKey];
        if (!stageData) {
            console.error(`VoxelScene: ステージキー[${this.stageKey}]がasset_define.jsonに見つかりません。`);
            return;
        }

        console.log(`VoxelScene: ステージ「${stageData.name}」のモデルをロードします...`);
        
        for (const obj of stageData.objects) {
            const modelKey = obj.key;
            const modelPath = assetDefine.models[modelKey];
            if (!modelPath) {
                console.warn(`モデルキー[${modelKey}]が見つかりません。`);
                continue;
            }
            
            try {
            const result = await SceneLoader.ImportMeshAsync(null, modelPath.rootUrl, modelPath.fileName, this.bjs_scene);
            const rootNode = result.meshes[0];
            const childMeshes = rootNode.getChildMeshes();
            if (childMeshes.length === 0) {
                rootNode.dispose();
                continue;
            }
            const mainMesh = childMeshes[0];

            // 1. 親から子メッシュを切り離し、独立させる
            mainMesh.setParent(null);
            
            // 2. 独立した子メッシュにプロパティを設定
            mainMesh.name = obj.name;
            mainMesh.position = new Vector3(obj.position.x, obj.position.y, obj.position.z);
            if (obj.scale) {
                mainMesh.scaling = new Vector3(obj.scale.x, obj.scale.y, obj.scale.z);
            }

            // 3. 独立したメッシュに物理ボディを設定
            if (obj.key === 'ground_basic') {
                mainMesh.physicsImpostor = new PhysicsImpostor(mainMesh, PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.5 }, this.bjs_scene);
            } else if (obj.key === 'player_borntest') {
                mainMesh.physicsImpostor = new PhysicsImpostor(mainMesh, PhysicsImpostor.BoxImpostor, { mass: 1, friction: 0.5 }, this.bjs_scene);
                this.player = mainMesh; 
                this.player.physicsImpostor.physicsBody.angularDamping = 1.0;
            }
            
            // 4. アニメーションを独立メッシュに紐付け直し
            if (result.animationGroups.length > 0) {
                const animationGroup = result.animationGroups[0];
                animationGroup.stop();
                const targetedAnimation = animationGroup.targetedAnimations[0];
                if (targetedAnimation) {
                    animationGroup.removeTargetedAnimation(targetedAnimation.animation);
                    animationGroup.addTargetedAnimation(targetedAnimation.animation, mainMesh);
                }
                animationGroup.play(true);
            }

            // 5. 役目を終えた親ノード等は破棄
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
    
  playerJump() {
    if (!this.player || !this.player.physicsImpostor) return;

    // ★★★ 物理ボディの状態を直接チェックする方法 ★★★
    // 1. まず、Y方向の速度がごくわずか（上昇も下降もしていない）であることを確認
    const velocity = this.player.physicsImpostor.getLinearVelocity();
    if (Math.abs(velocity.y) > 0.1) {
        return; // 上昇中または落下中はジャンプしない
    }

    // 2. 次に、足元からレイを飛ばして、地面との距離をチェック
    const origin = this.player.position;
    const ray = new BABYLON.Ray(origin, new BABYLON.Vector3(0, -1, 0));
    const hit = this.bjs_scene.pickWithRay(ray, (mesh) => {
        return mesh.name === "ground"; // "ground"という名前のメッシュのみを衝突対象とする
    });

    // 3. レイが非常に近い距離で地面に当たった場合のみジャンプを許可
    if (hit.hit && hit.distance < (this.player.getBoundingInfo().boundingBox.extendSize.y + 0.2)) {
        this.player.physicsImpostor.applyImpulse(
            new BABYLON.Vector3(0, 15, 0),
            this.player.getAbsolutePosition()
        );
    }
}

update(time, delta) {
    if (!this.player || !this.player.physicsImpostor) return;

    const speed = 5;
    const velocity = this.player.physicsImpostor.getLinearVelocity();
    
    // --- 1. カメラの向きを取得 ---
    const cameraForward = this.bjs_scene.activeCamera.getForwardRay().direction;
    const cameraRight = BABYLON.Vector3.Cross(BABYLON.Vector3.Up(), cameraForward).normalize();
    // Y成分を無視して、水平な移動ベクトルにする
    cameraForward.y = 0;
    cameraRight.y = 0;

    // --- 2. 入力に基づいて、カメラ基準の移動ベクトルを生成 ---
    let moveDirection = BABYLON.Vector3.Zero();
    if (this.cursors.up.isDown) {
        moveDirection.addInPlace(cameraForward); // 奥へ
    }
    if (this.cursors.down.isDown) {
        moveDirection.subtractInPlace(cameraForward); // 手前へ
    }
    if (this.cursors.left.isDown) {
        moveDirection.addInPlace(cameraRight.scale(-1)); // 左へ
    }
    if (this.cursors.right.isDown) {
        moveDirection.addInPlace(cameraRight); // 右へ
    }

    // --- 3. 移動ベクトルの正規化と速度の設定 ---
    const newVelocity = new BABYLON.Vector3(0, velocity.y, 0); // Y速度は維持
    if (moveDirection.length() > 0.1) {
        moveDirection.normalize();
        
        // ★ 移動方向へキャラクターを向ける
        const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
        this.player.rotation.y = BABYLON.Scalar.Lerp(this.player.rotation.y, targetRotation, 0.2);

        // ★ 移動ベクトルに速度を適用
        const finalMove = moveDirection.scale(speed);
        newVelocity.x = finalMove.x;
        newVelocity.z = finalMove.z;
    }
    
    // 最終的な速度を物理ボディに設定
    this.player.physicsImpostor.setLinearVelocity(newVelocity);
}
   
    shutdown() {
        console.log("VoxelScene: shutdown");
        const phaserContainer = document.getElementById('phaser-container');
        const bjsCanvasNode = document.getElementById('babylon-canvas');
        if (bjsCanvasNode) bjsCanvasNode.style.display = 'none';
        if (phaserContainer) phaserContainer.style.display = 'block';

        this.scale.off('resize', this.resize, this);
        this.input.keyboard.off('keydown-ESC');
        this.input.keyboard.off('keydown-SPACE');

        if (this.bjs_engine) {
            this.bjs_engine.stopRenderLoop();
            this.bjs_engine.dispose();
            this.bjs_engine = null;
        }
        this.bjs_scene = null;
        this.player = null;
        this.cursors = null;
        
        super.shutdown();
    }
}
