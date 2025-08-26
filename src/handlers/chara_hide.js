/**
 * [chara_hide] タグの処理
 * キャラクターをフェードアウトさせてから破棄する
 * @param {ScenarioManager} manager
 * @param {Object} params - { name, time }
 * @returns {Promise<void>}
 */
export function handleCharaHide(manager, params) {
    return new Promise(resolve => {
        const name = params.name;
        if (!name) {
            console.warn('[chara_hide] name属性は必須です。');
            resolve();
            return;
        }

        const chara = manager.scene.characters[name];
        if (!chara) {
            console.warn(`[chara_hide] 非表示対象のキャラクター[${name}]は既に存在しません。`);
            resolve();
            return;
        }

        // ★★★ 完了時の共通処理を内部関数として定義 ★★★
        const finalize = () => {
            chara.destroy();
            delete manager.scene.characters[name];
            // ★★★ stateManagerの更新は不要 ★★★
            resolve(); // Promiseを解決して完了を通知
        };

        const time = Number(params.time) || 0;

        if (time > 0) {
            // フェードアウトさせてから完了処理を呼ぶ
            manager.scene.tweens.add({
                targets: chara,
                alpha: 0,
                duration: time,
                ease: 'Linear',
                onComplete: finalize // アニメーション完了時に finalize を実行
            });
        } else {
            // 即座に完了処理を呼ぶ
            finalize();
        }
    });
}