/**
 * [video] タグの処理
 * 動画を再生する
 * @param {Object} params - {storage, mute, loop}
 */
export function handleVideo(manager, params) {
    const storage = params.storage;
    if (!storage) { console.warn('[video] storageは必須です。'); manager.finishTagExecution(); return; }

    const gameWidth = manager.scene.scale.width;
    const gameHeight = manager.scene.scale.height;

    // ★ 1. 動画オブジェクトを作成
    const video = manager.scene.add.video(gameWidth / 2, gameHeight / 2, storage);
    
    // ★ 2. 再生を開始
    // ブラウザのポリシーにより、最初のクリックまでは無音で再生開始する必要がある
    video.play(params.loop === 'true');
    console.log(`動画[${storage}]を再生します。`);

    // 音量を設定 (mute属性か、コンフィグ値を参照)
    if (params.mute === 'true') {
        video.setMute(true);
    } else {
        const volume = manager.configManager.getValue('bgmVolume'); // BGM音量を流用
        video.setVolume(volume);
    }
    
    // ★ 3. 再生終了を待つ
    // ループ再生でない場合のみ、完了イベントを待つ
    if (params.loop !== 'true') {
        video.once('complete', () => {
            console.log(`動画[${storage}]の再生が完了しました。`);
            video.destroy(); // 再生が終わったらオブジェクトを破棄
            manager.finishTagExecution();
        });
    } else {
        // ループ再生の場合は、完了を待たずに次に進む
        // [stopvideo]タグで止めるまで再生し続ける
        // (stopvideoタグは別途実装が必要)
        manager.finishTagExecution();
    }
}