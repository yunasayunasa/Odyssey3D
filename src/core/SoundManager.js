// SoundManager.js (最終確定・統一版)

export default class SoundManager {
    constructor(game) {
        this.game = game;
        this.sound = game.sound;
        this.configManager = this.game.registry.get('configManager');
        if (!this.configManager) {
            console.error("SoundManager: ConfigManagerが見つかりません！");
        }
        
        this.currentBgm = null;       // 現在のPhaser.Soundオブジェクト
        this.currentBgmKey = null;    // 現在のBGMキー

        // 音量変更イベントのリスナー
        this.configManager.on('change:bgmVolume', this.onBgmVolumeChange, this);
        this.game.events.once(Phaser.Core.Events.DESTROY, this.destroy, this);
    }

    // AudioContextを安全に再開
    resumeContext() {
        if (this.sound.context.state === 'suspended') {
            this.sound.context.resume().then(() => console.log("SoundManager: AudioContextが再開されました。"));
        }
    }
    
    // コンフィグ画面からの音量変更を即時反映
    onBgmVolumeChange(newVolume) {
        if (this.currentBgm && this.currentBgm.isPlaying) {
            this.currentBgm.setVolume(newVolume);
        }
    }

    /**
     * BGMを再生する (シンプル・確実版)
     * @param {string} key - 再生するBGMのアセットキー
     */
    playBgm(key) {
        this.resumeContext();

        // 1. もし何かBGMが再生中なら、まずそれを完全に停止・破棄する
        //    (同じ曲のキーであっても、シーン再挑戦時のために一度クリーンにする)
        if (this.currentBgm) {
            console.log(`[SoundManager] 古いBGM '${this.currentBgmKey}' を停止・破棄します。`);
            this.currentBgm.stop();
            this.currentBgm.destroy();
        }
        
        // 2. 新しいBGMを再生する
        const targetVolume = this.configManager.getValue('bgmVolume');
        console.log(`[SoundManager] 新しいBGM '${key}' を再生します。音量: ${targetVolume}`);

        const newBgm = this.sound.add(key, { loop: true });
        
        // 3. プロパティを更新
        this.currentBgm = newBgm;
        this.currentBgmKey = key;
        
        // 4. 音量を設定してから再生する (この順序が重要)
        newBgm.setVolume(targetVolume);
        newBgm.play();
    }

    /**
     * BGMを停止する (シンプル・確実版)
     */
    stopBgm() {
        if (this.currentBgm) {
            console.log(`[SoundManager] BGM '${this.currentBgmKey}' を停止・破棄します。`);
            this.currentBgm.stop();
            this.currentBgm.destroy();
        }
        // プロパティをクリア
        this.currentBgm = null;
        this.currentBgmKey = null;
    }

    playSe(key) {
        this.resumeContext();
        const seVolume = this.configManager.getValue('seVolume');
        this.sound.play(key, { volume: seVolume });
    }

    getCurrentBgmKey() {
        // isPlayingのチェックは、シーン遷移直後などに不安定になることがあるため、
        // プロパティの存在だけで判断する方が安定する
        return this.currentBgmKey;
    }
    
    // ゲーム終了時に呼ばれるクリーンアップ処理
    destroy() {
        if (this.configManager) {
            this.configManager.off('change:bgmVolume', this.onBgmVolumeChange, this);
        }
        this.stopBgm(); // 引数なし
        console.log("SoundManager: 破棄されました。");
    }
}
