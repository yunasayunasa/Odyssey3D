// src/scenes/PreloadScene.js (フリーズ問題を解決するための修正)

import ConfigManager from '../core/ConfigManager.js';
import StateManager from '../core/StateManager.js';
import SoundManager from '../core/SoundManager.js';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        // ★★★ 修正箇所: active: true を追加し、このシーンを自動起動させる ★★★
        super({ key: 'PreloadScene', active: true });
        
        // UI要素への参照を初期化 (stop()で破棄するため)
        this.progressBar = null;
        this.progressBox = null;
        this.percentText = null;
        this.loadingText = null;
    }

    preload() {
        console.log("PreloadScene: 起動。全アセットのロードを開始します。");
        
        // --- 1. ロード画面UIの表示 ---
        this.progressBox = this.add.graphics();
        this.progressBox.fillStyle(0x222222, 0.8).fillRect(340, 320, 600, 50);
        this.progressBar = this.add.graphics();
        this.percentText = this.add.text(640, 345, '0%', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
        this.loadingText = this.add.text(640, 280, 'Now Loading...', { fontSize: '36px', fill: '#ffffff' }).setOrigin(0.5);
        
        this.load.on('progress', (value) => {
            if (this.percentText) this.percentText.setText(parseInt(value * 100) + '%');
            if (this.progressBar) this.progressBar.clear().fillStyle(0xffffff, 1).fillRect(350, 330, 580 * value, 30);
        });
        
        // --- 2. 最初に必要なアセットのみをロード ---
        this.load.json('asset_define', 'assets/asset_define.json');
        this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');
    }

    create() {
           console.log("PreloadScene: create開始。コアマネージャーを初期化します。");
        
        // --- ConfigManagerとStateManagerを生成し、Registryに登録 ---
        const configManager = new ConfigManager();
        this.sys.registry.set('configManager', configManager);
        
        const stateManager = new StateManager();
        this.sys.registry.set('stateManager', stateManager);
        // --- asset_define.jsonに基づいて残りのアセットをロードキューに追加 ---
        const assetDefine = this.cache.json.get('asset_define');
        for (const key in assetDefine.images) { this.load.image(key, assetDefine.images[key]); }
        for (const key in assetDefine.sounds) { this.load.audio(key, assetDefine.sounds[key]); }
        for (const key in assetDefine.videos) { this.load.video(key, assetDefine.videos[key]); }
        for (const key in assetDefine.scenarios) { this.load.text(key, assetDefine.scenarios[key]); }
        
        // ゲームで使う可能性のあるシナリオファイルをすべてロード
        this.load.text('scene1.ks', 'assets/scene1.ks');
        this.load.text('scene2.ks', 'assets/scene2.ks');
        this.load.text('overlay_test.ks', 'assets/overlay_test.ks');
        this.load.text('test.ks', 'assets/test.ks');
        this.load.text('test_main.ks', 'assets/test_main.ks');
        this.load.text('test_sub.ks', 'assets/test_sub.ks');

        // --- 全てのアセットのロード完了後の処理を定義 ---
        this.load.once('complete', () => {
            console.log("PreloadScene: 全アセットロード完了。");
            
            // キャラクター定義の生成
            const charaDefs = {};
            for (const key in assetDefine.images) {
                const parts = key.split('_');
                if (parts.length === 2) {
                    const [charaName, faceName] = parts;
                    if (!charaDefs[charaName]) charaDefs[charaName] = { jname: charaName, face: {} };
                    charaDefs[charaName].face[faceName] = key;
                }
            }
            
            // SystemSceneを起動し、そのCREATEイベントを待ってから依存関係を解決する
              this.scene.launch('SystemScene', { initialGameData: {
                charaDefs: charaDefs,
                startScenario: 'test.ks'
            }});
            
            // 自身の役目は終わったので停止する
            this.scene.stop(this.scene.key);
        });
        
        this.load.start();
    }

    stop() {
        super.stop();
        console.log("PreloadScene: stop されました。ロード画面UIを破棄します。");
        if (this.progressBar) { this.progressBar.destroy(); this.progressBar = null; }
        if (this.progressBox) { this.progressBox.destroy(); this.progressBox = null; }
        if (this.percentText) { this.percentText.destroy(); this.percentText = null; }
        if (this.loadingText) { this.loadingText.destroy(); this.loadingText = null; }
    }
}