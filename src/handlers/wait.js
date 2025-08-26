// src/handlers/wait.js (スキップモード対応)

/**
 * [wait] タグの処理
 * 指定された時間、シナリオの進行を待機する。
 * スキップモード中は待機しない。
 * @param {ScenarioManager} manager
 * @param {Object} params - { time }
 * @returns {Promise<void>}
 */
export function handleWait(manager, params) {
    // ★★★ 修正箇所: manager.modeが'skip'の場合は即座に解決する ★★★
    if (manager.mode === 'skip') {
        return Promise.resolve();
    }
    
    // 通常モードまたはオートモードの場合は、これまで通り待機処理を行う
    return new Promise(resolve => {
        const time = parseInt(params.time, 10) || 1000; // time属性がなければ1秒待つ
        manager.scene.time.delayedCall(time, resolve);
    });
}
