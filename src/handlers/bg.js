/**
 * [bg] タグの処理
 * 背景の画像または動画を表示・切り替えする
 * @param {ScenarioManager} manager
 * @param {Object} params - { storage, time }
 * @returns {Promise<void>}
 */
export function handleBg(manager, params) {
    return new Promise(resolve => {
        const storage = params.storage;
        if (!storage) {
            console.warn('[bg] storageは必須です。');
            resolve(); // 即座に完了
            return;
        }

        const time = Number(params.time) || 1000;
        const scene = manager.scene;
        const bgLayer = manager.layers.background;
        const gameWidth = scene.scale.width;
        const gameHeight = scene.scale.height;

        // --- 1. 新しい背景オブジェクトを作成 ---
        let newBg;
        if (scene.cache.video.has(storage)) {
            newBg = scene.add.video(gameWidth / 2, gameHeight / 2, storage);
            newBg.play(true);
            newBg.setVolume(manager.configManager.getValue('bgmVolume'));
        } else if (scene.textures.exists(storage)) {
            newBg = scene.add.image(gameWidth / 2, gameHeight / 2, storage);
        } else {
            console.warn(`[bg] アセット[${storage}]が見つかりません。`);
            resolve();
            return;
        }

        newBg.setDisplaySize(gameWidth, gameHeight);
        newBg.setAlpha(0);
        bgLayer.add(newBg);

        // --- 2. クロスフェード処理 ---
        const oldBg = bgLayer.list.length > 1 ? bgLayer.getAt(0) : null;

        // 新しい背景をフェードイン
        scene.tweens.add({
            targets: newBg,
            alpha: 1,
            duration: time,
            ease: 'Linear',
            onComplete: () => {
                // ★★★ 新しい背景のアニメーションが終わったら、Promiseを解決して完了を通知 ★★★
                // 古い背景のフェードアウトを待たずに完了とするか、待つかは設計次第。
                // 一般的には待たずに次に進むことが多い。
                resolve();
            }
        });

        // 古い背景があればフェードアウトして破棄
        if (oldBg) {
            scene.tweens.add({
                targets: oldBg,
                alpha: 0,
                duration: time,
                ease: 'Linear',
                onComplete: () => {
                    if (oldBg.stop) { // is a video
                        oldBg.stop();
                    }
                    oldBg.destroy();
                }
            });
        }
        
        // ★★★ stateManagerの更新処理は完全に削除 ★★★
        
        // ★★★ finishTagExecutionの呼び出しもPromiseに置き換えるので不要 ★★★
    });
}