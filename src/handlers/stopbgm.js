/**
 * [stopbgm] タグの処理
 * 現在再生中のBGMをフェードアウトさせて停止する
 * @param {ScenarioManager} manager
 * @param {Object} params - { time }
 * @returns {Promise<void>}
 */
export function handleStopBgm(manager, params) {
    return new Promise(resolve => {
        const time = Number(params.time) || 0; // フェードアウト時間

        // ★★★ SoundManagerに停止を依頼するだけ ★★★
        manager.soundManager.stopBgm(time);

        // ★★★ stateManagerの更新は不要 ★★★
        // SoundManagerが現在のBGMをnullに設定し、
        // セーブ時にStateManagerがその状態を取得する

        // フェードアウト時間分だけ待機してから完了を通知する
        manager.scene.time.delayedCall(time, () => {
            resolve();
        });
    });
}