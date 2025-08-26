/**
 * [vibrate] タグの処理
 * カメラ（画面全体）を揺らす
 * @param {ScenarioManager} manager
 * @param {Object} params - { time, power }
 * @returns {Promise<void>}
 */
export function handleVibrate(manager, params) {
    return new Promise(resolve => {
        const time = Number(params.time) || 500;
        // vibrateはshakeより弱い揺れのイメージなので、デフォルト値を少し小さくする
        const power = Number(params.power) || 0.005; 

        const camera = manager.scene.cameras.main;

        // ★★★ カメラのシェイク完了イベントを一度だけリッスンする ★★★
        camera.once('camerashakecomplete', () => {
            resolve(); // シェイク完了時にPromiseを解決
        });

        // Phaserのカメラシェイク機能を呼び出す
        camera.shake(time, power);
        
        // ★★★ delayedCall や finishTagExecution は不要 ★★★
    });
}