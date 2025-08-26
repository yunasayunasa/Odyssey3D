const Container = Phaser.GameObjects.Container;

export default class MessageWindow extends Container {
    constructor(scene, soundManager, configManager) {
        super(scene, 0, 0);

        this.scene = scene; // ★ シーンへの参照を保持
        this.soundManager = soundManager;
        this.configManager = configManager;
        this.charByCharTimer = null;
        this.isTyping = false;

        // ★★★ セーブ＆ロード用の状態保持プロパティ ★★★
        this.currentText = '';
        this.currentSpeaker = null;

        // --- ウィンドウとテキストのセットアップ ---
        const gameWidth = scene.scale.width;
        const gameHeight = scene.scale.height;
        const windowY = gameHeight - 180;
        this.windowImage = scene.add.image(gameWidth / 2, windowY, 'message_window');

        const padding = 35;
        const textWidth = this.windowImage.width - (padding * 2);
        const textHeight = this.windowImage.height - (padding * 2);

        this.textObject = scene.add.text(
            this.windowImage.x - (this.windowImage.width / 2) + padding,
            this.windowImage.y - (this.windowImage.height / 2) + padding,
            '',
            {
                fontFamily: '"Noto Sans JP", sans-serif',
                fontSize: '36px',
                fill: '#ffffff',
                fixedWidth: textWidth,
                fixedHeight: textHeight
            }
        );

        // --- コンフィグと連携するテキスト速度 ---
        this.textDelay = 50; // デフォルト値
        this.updateTextSpeed(); // コンフィグから初期値を取得
        this.configManager.on('change:textSpeed', this.updateTextSpeed, this);

        // --- クリック待ちアイコン ---
        const iconX = (gameWidth / 2) + (this.windowImage.width / 2) - 60;
        const iconY = windowY + (this.windowImage.height / 2) - 50;
        this.nextArrow = scene.add.image(iconX, iconY, 'next_arrow');
        this.nextArrow.setScale(0.5).setVisible(false);
        this.arrowTween = scene.tweens.add({
            targets: this.nextArrow,
            y: this.nextArrow.y - (10 * this.nextArrow.scaleY),
            duration: 400,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
            paused: true
        });

        // --- コンテナに追加 & シーンに登録 ---
        this.add([this.windowImage, this.textObject, this.nextArrow]);
        scene.add.existing(this);
    }

    // ★★★ コンフィグ値から速度を更新するヘルパーメソッド ★★★
    updateTextSpeed() {
        const textSpeedValue = this.configManager.getValue('textSpeed');
        this.textDelay = 100 - textSpeedValue;
        console.log(`テキスト表示速度を ${this.textDelay}ms に更新`);
    }

    // ★★★ セッターをリネーム（より明確に） ★★★
    setTypingSpeed(newSpeed) {
        this.textDelay = newSpeed;
    }

   // MessageWindow.js にこのコードを貼り付けてください

    /**
     * テキストを設定し、表示完了をPromiseで通知するメソッド (新バージョン)
     * @param {string} text - 表示する全文
     * @param {boolean} useTyping - テロップ表示を使うかどうか
     * @param {string|null} speaker - 話者名（任意）
     * @returns {Promise<void>} 表示完了時に解決されるPromise
     */
    setText(text, useTyping = true, speaker = null) {
        return new Promise(resolve => {
            // ★ 現在の状態をプロパティとして保存
            this.currentText = text;
            this.currentSpeaker = speaker;
    
            // ★ 既存のタイマーがあれば完全に停止・破棄
            if (this.charByCharTimer) {
                this.charByCharTimer.remove();
                this.charByCharTimer = null;
            }
            // ★ テキストをクリア
            this.textObject.setText('');
    
            const typeSoundMode = this.configManager.getValue('typeSound');
    
            // タイピングなし、または即時表示の場合
            if (!useTyping || text.length === 0 || this.textDelay <= 0) {
                this.textObject.setText(text);
                this.isTyping = false;
                resolve(); // 即座にPromiseを解決して完了を通知
                return;
            }
            
            // タイピングありの場合
            this.isTyping = true;
            let index = 0;
            
            this.charByCharCharTimer = this.scene.time.addEvent({
                delay: this.textDelay,
                callback: () => {
                    if (typeSoundMode === 'se') {
                        this.soundManager.playSe('popopo');
                    }
                    // ここで直接 text を参照するように変更
                    this.textObject.text += text[index];
                    index++;
                    if (index === text.length) {
                        if(this.charByCharCharTimer) this.charByCharCharTimer.remove();
                        this.isTyping = false;
                        resolve(); // ★ すべて表示し終わったらPromiseを解決！
                    }
                },
                callbackScope: this,
                loop: true
            });
        });
    }
    
    // MessageWindow.js

    setText(text, useTyping = true, speaker = null) {
        // ★ Promiseのresolve関数をクラスのプロパティに保持する
        this.typingResolve = null; 

        return new Promise(resolve => {
            // ★ resolve関数を保持
            this.typingResolve = resolve; 

            this.currentText = text;
            this.currentSpeaker = speaker;
    
            if (this.charByCharTimer) {
                this.charByCharTimer.remove();
                this.charByCharTimer = null;
            }
            this.textObject.setText('');
    
            const typeSoundMode = this.configManager.getValue('typeSound');
    
            if (!useTyping || text.length === 0 || this.textDelay <= 0) {
                this.textObject.setText(text);
                this.isTyping = false;
                if (this.typingResolve) this.typingResolve(); // 即座に解決
                return;
            }
            
            this.isTyping = true;
            this.fullText = text; // fullTextプロパティを確実に設定
            let index = 0;
            
            this.charByCharTimer = this.scene.time.addEvent({
                delay: this.textDelay,
                callback: () => {
                    if (typeSoundMode === 'se') {
                        this.soundManager.playSe('popopo');
                    }
                    this.textObject.text += this.fullText[index];
                    index++;
                    if (index === this.fullText.length) {
                        if(this.charByCharTimer) this.charByCharTimer.remove();
                        this.charByCharTimer = null;
                        this.isTyping = false;
                        if (this.typingResolve) this.typingResolve(); // 完了時に解決
                    }
                },
                callbackScope: this,
                loop: true
            });
        });
    }

    skipTyping() {
        if (!this.isTyping || !this.charByCharTimer) return;

        this.textObject.setText(this.fullText);

        this.charByCharTimer.remove();
        this.charByCharTimer = null;
        this.isTyping = false;
        
        // ★ 保持していたresolve関数を呼び出して、Promiseを解決させる
        if (this.typingResolve) {
            this.typingResolve();
            this.typingResolve = null; // 一度使ったらクリア
        }
    }

    // ★★★ ロード時にウィンドウの状態をリセットするためのメソッド ★★★
    reset() {
        this.textObject.setText('');
        this.currentText = '';
        this.currentSpeaker = null;
        this.isTyping = false;
        if (this.charByCharTimer) {
            this.charByCharTimer.remove();
        }
        this.hideNextArrow();
    }

    showNextArrow() {
        this.nextArrow.setVisible(true);
        if (this.arrowTween.isPaused()) {
            this.arrowTween.resume();
        }
    }
    
    hideNextArrow() {
        this.nextArrow.setVisible(false);
        if (this.arrowTween.isPlaying()) {
            this.arrowTween.pause();
        }
    }

    get textBoxWidth() {
        return this.textObject.width;
    }
}