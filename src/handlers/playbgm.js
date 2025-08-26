// src/handlers/playbgm.js (修正版)

/**
 * [playbgm] タグの処理
 * BGMを再生し、完了するまで待機する。
 * @param {ScenarioManager} manager
 * @param {Object} params - { storage, fadein }
 * @returns {Promise<void>}
 */
export async function handlePlayBgm(manager, params) {
    const key = params.storage;
    const fadeInTime = params.fadein ? parseInt(params.fadein, 10) : 0;
    await manager.soundManager.playBgm(key, fadeInTime);
}