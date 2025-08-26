/**
 * [fadeout] タグの処理
 * 指定された色へ画面をフェードアウトさせる
 * @param {ScenarioManager} manager
 * @param {Object} params - { time, color }
 * @returns {Promise<void>}
 */
export function handleFadeout(manager, params) {
    return new Promise(resolve => {
        const time = Number(params.time) || 1000;
        
        // カラーコードのパース
        const colorStr = params.color || '000000';
        const colorInt = parseInt(colorStr.replace(/^0x/, ''), 16);
        
        const r = (colorInt >> 16) & 0xFF;
        const g = (colorInt >> 8) & 0xFF;
        const b = colorInt & 0xFF;
        
        // ★★★ カメラのフェードアウト完了イベントを一度だけリッスンする ★★★
        manager.scene.cameras.main.once('camerafadeoutcomplete', () => {
            resolve(); // イベントが発火したらPromiseを解決
        });

        // カメラのフェードアウトエフェクトを開始
        manager.scene.cameras.main.fadeOut(time, r, g, b);
        
        // ★★★ delayedCall や finishTagExecution は不要 ★★★
    });
}