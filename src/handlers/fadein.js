// src/handlers/fadein.js

/**
 * [fadein] タグの処理
 * 画面をフェードインさせる
 * @param {ScenarioManager} manager
 * @param {Object} params - { time }
 * @returns {Promise<void>}
 */
export function handleFadein(manager, params) {
    // ★★★ これが真の解決策 ★★★
    return new Promise(resolve => {
        const duration = params.time ? parseInt(params.time, 10) : 1000;
        
        manager.scene.cameras.main.fadeIn(duration, 0, 0, 0, (camera, progress) => {
            if (progress === 1) {
                // フェードが100%完了したときにPromiseを解決する
                console.log("[fadein] 完了。");
                resolve();
            }
        });
    });
}
