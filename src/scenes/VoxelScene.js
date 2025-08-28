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
        this.stateManager = null;
        this.selectedMesh = null; // 現在選択中のメッシュ
        this.editMode = 'translate'; // 'translate', 'rotate', 'scale'
    }
    
    init(data) {
        if (data && data.stageKey) {
            this.stageKey = data.stageKey;
        }
    }

    async create() {
        this.stateManager = this.sys.registry.get('stateManager');
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
if (this.stateManager.sf.debug_mode) {
            this.initEditorControls();
        }
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
    
    // VoxelScene.js -> update()メソッド

update(time, delta) {
    // --- 【最優先】エンジンやシーンが存在しない場合は、即座に処理を中断 ---
    if (!this.bjs_engine || !this.bjs_scene) return;


    // --- 【モード分岐】デバッグモードか、通常のプレイモードかを判定 ---

    if (this.stateManager && this.stateManager.sf.debug_mode) {
        
        // --- ★★★ 1. インゲーム・エディタモードの処理 ★★★ ---
        
        // 選択中のメッシュがなければ、何もしない
        if (!this.selectedMesh) return;

        // 操作の速度を定義
        const moveSpeed = 0.1;   // 位置
        const rotateSpeed = 0.05; // 回転
        const scaleSpeed = 0.01;  // 拡縮

        // 現在の編集モードに応じて、キーボード入力でプロパティを変更
        switch (this.editMode) {
            case 'translate': // --- 移動モード (Tキー) ---
                if (this.cursors.left.isDown)  this.selectedMesh.position.x -= moveSpeed;
                if (this.cursors.right.isDown) this.selectedMesh.position.x += moveSpeed;
                if (this.cursors.up.isDown)    this.selectedMesh.position.z += moveSpeed; // 3D空間の奥へ
                if (this.cursors.down.isDown)  this.selectedMesh.position.z -= moveSpeed; // 3D空間の手前へ
                // (Shift + 上下でY座標を操作)
                if (this.input.keyboard.addKey('SHIFT').isDown) {
                    if (this.cursors.up.isDown)   this.selectedMesh.position.y += moveSpeed;
                    if (this.cursors.down.isDown) this.selectedMesh.position.y -= moveSpeed;
                }
                break;

            case 'rotate': // --- 回転モード (Rキー) ---
                if (this.cursors.left.isDown)  this.selectedMesh.rotation.y += rotateSpeed; // Y軸周りに回転
                if (this.cursors.right.isDown) this.selectedMesh.rotation.y -= rotateSpeed;
                if (this.cursors.up.isDown)    this.selectedMesh.rotation.x += rotateSpeed; // X軸周りに回転
                if (this.cursors.down.isDown)  this.selectedMesh.rotation.x -= rotateSpeed;
                break;

            case 'scale': // --- 拡縮モード (Sキー) ---
                if (this.cursors.up.isDown) {
                    this.selectedMesh.scaling.addInPlace(new BABYLON.Vector3(scaleSpeed, scaleSpeed, scaleSpeed));
                }
                if (this.cursors.down.isDown) {
                    this.selectedMesh.scaling.subtractInPlace(new BABYLON.Vector3(scaleSpeed, scaleSpeed, scaleSpeed));
                }
                break;
        }

    } else {

        // --- ★★★ 2. 通常のプレイモードの処理 ★★★ ---

        // プレイヤーオブジェクトが存在し、物理ボディも有効な場合のみ実行
        if (!this.player || !this.player.physicsImpostor) return;

        const speed = 5;
        const velocity = this.player.physicsImpostor.getLinearVelocity();
        const camera = this.bjs_scene.activeCamera;

        // カメラの向きを基準とした、水平な移動ベクトルを計算
        const cameraForward = camera.getForwardRay(1).direction;
        const cameraRight = BABYLON.Vector3.Cross(BABYLON.Vector3.Up(), cameraForward).normalize();
        cameraForward.y = 0;
        cameraRight.y = 0;

        let moveDirection = BABYLON.Vector3.Zero();
        if (this.cursors.left.isDown)  moveDirection.addInPlace(cameraRight.scale(-1));
        if (this.cursors.right.isDown) moveDirection.addInPlace(cameraRight);
        if (this.cursors.up.isDown)    moveDirection.addInPlace(cameraForward);
        if (this.cursors.down.isDown)  moveDirection.addInPlace(cameraForward.scale(-1));

        // Y方向の速度は物理エンジンに任せる
        const newVelocity = new BABYLON.Vector3(0, velocity.y, 0);
        let currentAnimName = 'idle';

        if (moveDirection.length() > 0.1) {
            // --- 移動中の処理 ---
            currentAnimName = this.isGrounded() ? 'run' : 'jump';
            moveDirection.normalize();
            
            // 移動速度の計算
            const finalMove = moveDirection.scale(speed);
            newVelocity.x = finalMove.x;
            newVelocity.z = finalMove.z;

            // 移動方向への自動的な方向転換
            const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
            // 見た目の回転(rotation.y)を滑らかに変化させる
            this.player.rotation.y = BABYLON.Scalar.Lerp(this.player.rotation.y, targetRotation, 0.2);

        } else {
            // --- 静止中の処理 ---
            currentAnimName = this.isGrounded() ? 'idle' : 'jump';
            newVelocity.x = 0;
            newVelocity.z = 0;
        }

        // アニメーションの切り替え
        const animToPlay = this.animations[currentAnimName] || this.animations['T-pose'];
        if (animToPlay && !animToPlay.isPlaying) {
            for (const name in this.animations) {
                if (this.animations[name].isPlaying) {
                    this.animations[name].stop();
                }
            }
            animToPlay.play(true);
        }
        
        // 最終的な速度を物理ボディに設定
        this.player.physicsImpostor.setLinearVelocity(newVelocity);
    }
}
   
  // ★★★ エディタの初期化メソッドを新規作成 ★★★
    initEditorControls() {
        console.log("VoxelScene: Initializing In-Game Editor...");

        // マウスクリックでオブジェクトを選択する
        this.input.on('pointerdown', (pointer) => {
            const pickResult = this.bjs_scene.pick(pointer.x, pointer.y);
            if (pickResult.hit) {
                this.selectedMesh = pickResult.pickedMesh;
                console.log(`[Editor] Selected: ${this.selectedMesh.name}`);
                // (ここに、選択したオブジェクトをハイライトする処理などを追加すると、よりリッチになる)
            } else {
                this.selectedMesh = null;
                console.log("[Editor] Deselected.");
            }
        });

        // キーボードで編集モードを切り替え (T: 移動, R: 回転, S: 拡縮)
        this.input.keyboard.on('keydown-T', () => { this.editMode = 'translate'; console.log("Edit Mode: Translate"); });
        this.input.keyboard.on('keydown-R', () => { this.editMode = 'rotate'; console.log("Edit Mode: Rotate"); });
        this.input.keyboard.on('keydown-S', () => { this.editMode = 'scale'; console.log("Edit Mode: Scale"); });

        // 「保存」キー (Pキーなど) で、現在のシーン情報をJSONとしてコンソールに出力
        this.input.keyboard.on('keydown-P', this.exportSceneToJson, this);
    }

    // ★★★ シーン情報をJSONで出力するメソッドを新規作成 ★★★
    exportSceneToJson() {
        if (!this.bjs_scene) return;
        console.log("%c--- SCENE DATA EXPORT ---", "color: lightgreen; font-weight: bold;");
        
        const exportData = {
            objects: []
        };

        // シーン内のすべてのメッシュを走査
        this.bjs_scene.meshes.forEach(mesh => {
            // asset_define.jsonの形式に合わせてデータを構築
            // (名前から元のキーを取得するなど、工夫が必要)
            if (mesh.name && mesh.name !== 'ground' && mesh.name !== 'player') return; // 例：特定の名前だけ

            exportData.objects.push({
                key: mesh.name === 'ground' ? 'ground_basic' : 'player_borntest', // 仮
                name: mesh.name,
                position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
                rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
                scale: { x: mesh.scaling.x, y: mesh.scaling.y, z: mesh.scaling.z }
            });
        });

        // JSON文字列に変換してコンソールに出力 (インデント付きで見やすく)
        console.log(JSON.stringify(exportData, null, 2));
        console.log("%c--- EXPORT COMPLETE ---", "color: lightgreen; font-weight: bold;");
    }

    shutdown() {
        // ... (以前の、クリーンなshutdownメソッド)
    }
}