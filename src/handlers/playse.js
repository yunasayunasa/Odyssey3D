/**
 * [playse] タグの処理
 * 効果音(SE)を再生する。このタグは待機しない。
 * @param {ScenarioManager} manager
 * @param {Object} params - { storage, volume }
 */
export function handlePlaySe(manager, params) {
    const storage = params.storage;
    if (!storage) {
        console.warn('[playse] storage属性は必須です。');
       return Promise.resolve(); // 何もせず同期的に完了
    }

    // ★★★ SoundManagerに再生を依頼するだけ ★★★
    // volumeなどの詳細な設定はSoundManager側で解釈するのが望ましい
    manager.soundManager.playSe(storage, params);
return Promise.resolve();
    // ★★★ このタグの処理は一瞬で終わるので、何も呼び出す必要はない ★★★
    // ScenarioManagerのメインループが、この関数の終了後に次の行の処理に進む
}