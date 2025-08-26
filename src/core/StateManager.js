// src/core/StateManager.js (最終版)

export default class StateManager extends Phaser.Events.EventEmitter {
    constructor() {
        super(); // ★★★ 追加: 親クラスのコンストラクタを呼び出す ★★★
        this.f = {};
        this.sf = this.loadSystemVariables(); 
        if (!this.sf.history) this.sf.history = [];
    }
      // --- f (ゲーム変数) の管理 ---

    /**
     * f変数を設定し、変更イベントを発行する
     * @param {string} key - f変数のキー
     * @param {*} value - 設定する値
     */
    setF(key, value) {
        const oldValue = this.f[key];
        if (oldValue !== value) {
            this.f[key] = value;
            this.emit('f-variable-changed', key, value, oldValue);
        }
    }

    // --- sf (システム変数) の管理 ---

    /**
     * sf変数を設定し、変更イベントを発行し、自動保存する
     * @param {string} key - sf変数のキー
     * @param {*} value - 設定する値
     */
      // --- sf (システム変数) の管理 ---
    setSF(key, value) {
        const oldValue = this.sf[key];
        // JSON.stringifyで比較し、オブジェクトや配列の変更も検知
        if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
            this.sf[key] = value;
            this.emit('sf-variable-changed', key, value, oldValue);
            this.saveSystemData(); // 変更があったら即座に保存
        }
    }

    /**
     * システムデータをlocalStorageに保存する
     */
    saveSystemData() {
        try {
            localStorage.setItem('my_novel_engine_system', JSON.stringify(this.sf));
            console.log("%c[StateManager] System data saved to localStorage.", "color: lightgreen; font-weight: bold;", this.sf);
        } catch (e) {
            console.error("システム変数の保存に失敗しました。", e);
        }
    }

    /**
     * システムデータをlocalStorageから読み込む
     * @returns {object} 読み込んだデータ、または空のオブジェクト
     */
      loadSystemData() {
        try {
            const data = localStorage.getItem('my_novel_engine_system');
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error("システム変数の読み込みに失敗しました。", e);
            return {};
        }
    }



    /**
     * ゲームの現在の状態をすべて収集して返す
     * @param {ScenarioManager} scenarioManager - 現在のシナリオの状態を取得するための参照
     * @returns {Object} 現在のゲーム状態のスナップショット
     */
    getState(scenarioManager) {
        const scene = scenarioManager.scene;
        
        const characterStates = {};
        for (const name in scene.characters) {
            const chara = scene.characters[name];
            if (chara && chara.visible && chara.alpha > 0) {
                characterStates[name] = {
                    storage: chara.texture.key,
                    x: chara.x, y: chara.y,
                    scaleX: chara.scaleX, scaleY: chara.scaleY,
                    alpha: chara.alpha, flipX: chara.flipX,
                    tint: chara.tintTopLeft,
                };
            }
        }
        
        const backgroundState = scenarioManager.layers.background.list.length > 0
            ? scenarioManager.layers.background.list[0].texture.key
            : null;

        const scenarioState = {
            fileName: scenarioManager.currentFile,
            line: scenarioManager.currentLine,
            ifStack: scenarioManager.ifStack,
            callStack: scenarioManager.callStack,
            isWaitingClick: scenarioManager.isWaitingClick,
            isWaitingChoice: scenarioManager.isWaitingChoice,
            pendingChoices: scene.pendingChoices,
            currentText: scenarioManager.messageWindow.currentText,
            speakerName: scenarioManager.messageWindow.currentSpeaker,
        };
          // ★★★ 1. デバッグしたい値をまず変数に格納する ★★★
        const currentBgmKey = scenarioManager.soundManager.getCurrentBgmKey();

        // ★★★ 2. 変数を使ってコンソールに出力する ★★★
        console.log(`[StateManager.getState] Saving BGM key: '${currentBgmKey}'`);

        return {
            saveDate: new Date().toLocaleString('ja-JP'),
            variables: { f: this.f }, 
            scenario: scenarioState,
            layers: {
                background: backgroundState,
                characters: characterStates,
            },
            sound: {
                // ★★★ 3. 変数をオブジェクトのプロパティとして設定する ★★★
                bgm: currentBgmKey
            }
        };
    
        
        return {
            saveDate: new Date().toLocaleString('ja-JP'),
            variables: { f: this.f }, 
            scenario: scenarioState,
            layers: {
                background: backgroundState,
                characters: characterStates,
            },
            sound: {
                bgm: scenarioManager.soundManager.getCurrentBgmKey(),
                
            }
        };
    }

     /**
     * ロードした状態から変数を復元する
     * @param {Object} loadedState - localStorageから読み込んだ状態オブジェクト
     */
    setState(loadedState) {
        // ★★★ 修正点①: あなたの元のロジックを尊重する ★★★
        this.f = loadedState.variables.f || {};
        // sf変数の復元もここで行うのが安全
        this.sf = loadedState.variables.sf || this.loadSystemVariables();

        // ★★★ 修正点②: ロード完了後、すべてのf変数について「変更通知」を発行する ★★★
        // これにより、すべてのHUDが自分自身の表示を更新する
        for (const key in this.f) {
            this.emit('f-variable-changed', key, this.f[key]);
        }
    }

         /**
     * 文字列のJavaScript式を安全に評価・実行し、変更を通知する。
     * @param {string} exp - 実行する式 (例: "f.hoge = 10")
     * @returns {*} 評価結果
     */
    eval(exp) {
        try {
            const f = this.f || {};
            const sf = this.sf || {};
            
            // ★★★ 修正箇所: 変更前のf変数の状態をコピーして保持 ★★★
            // JSON.parse(JSON.stringify(f)) は確実だが、パフォーマンスが懸念される場合はシャローコピーで試す
            const f_before = { ...f };

            const result = new Function('f', 'sf', `'use strict'; return (${exp});`)(f, sf);
            
            // 変更後のfの参照をthis.fに再代入
            this.f = f;

            // ★★★ 修正箇所: 変更前と変更後のf変数を比較し、変更があればイベントを発行 ★★★
            // 新旧両方のキーのセットを作成し、変更がないかチェックする
            const allKeys = new Set([...Object.keys(f_before), ...Object.keys(this.f)]);
            allKeys.forEach(key => {
                // 値が変更された、またはキーが新しく追加/削除された場合
                if (f_before[key] !== this.f[key]) {
                    console.log(`[StateManager.eval] f.${key} が変更されました: ${f_before[key]} -> ${this.f[key]}`);
                    this.emit('f-variable-changed', key, this.f[key]);
                }
            });

            this.saveSystemVariables(); 
            return result;
        } catch (e) {
            console.warn(`[StateManager.eval] 式の評価中にエラーが発生しました: "${exp}"`, e);
            return undefined; 
        }
    }


    // システム変数のセーブ/ロード、履歴の追加 (変更なし)
    saveSystemVariables() {
        try {
            localStorage.setItem('my_novel_engine_system', JSON.stringify(this.sf));
        } catch (e) { console.error("システム変数の保存に失敗しました。", e); }
    }
    loadSystemVariables() {
        try {
            const data = localStorage.getItem('my_novel_engine_system');
            return data ? JSON.parse(data) : {};
        } catch (e) { console.error("システム変数の読み込みに失敗しました。", e); return {}; }
    }
    addHistory(speaker, dialogue) {
        this.sf.history.push({ speaker, dialogue });
        if (this.sf.history.length > 100) this.sf.history.shift();
        this.saveSystemVariables();
    }
      // ★★★ 追加: f/sf変数の値を安全に取得するメソッド ★★★
    getValue(exp) {
        try {
            const f = this.f;
            const sf = this.sf;
            // new Functionを使って、より安全に値を取得
            return new Function('f', 'sf', `return ${exp}`)(f, sf);
        } catch (e) {
            // 式が不正な場合や、存在しないプロパティにアクセスしようとした場合はundefinedを返す
            console.warn(`[StateManager.getValue] 式の評価に失敗しました: "${exp}"`, e);
            return undefined;
        }
    }

}
