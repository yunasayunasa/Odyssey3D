// src/handlers/jump.js (最終確定版)

/**
 * [jump] タグの処理
 * 他のシーンへの遷移、またはファイル内のラベルへのジャンプを行う。
 * @param {ScenarioManager} manager
 * @param {Object} params - { storage, target, params }
 */
export function handleJump(manager, params) {
    
    // --- シーン間遷移の場合 ---
    if (params.storage) {
        console.log(`[jump] 別シーン[${params.storage}]へジャンプします。`);

        // 1. オートセーブを実行
        manager.scene.performSave(0);

        // 2. 遷移パラメータを解決
        let transitionParams = {};
        if (params.params) {
            try {
                // stateManager.evalはオブジェクトを返さないので、直接代入はしない
                // evalでf変数を更新し、その結果を新しいオブジェクトに詰める
                manager.stateManager.eval(params.params);

                // パラメータ文字列からキーを抽出して、現在のf変数の値を集める
                // 例: "{player_level:f.love_meter, player_name:'&f.player_name'}"
                const keys = params.params.match(/(\w+):/g).map(k => k.replace(':', ''));
                for (const key of keys) {
                    const fkey = key.startsWith('f.') ? key : `f.${key}`;
                    if (manager.stateManager.f[fkey.substring(2)] !== undefined) {
                         transitionParams[key] = manager.stateManager.f[fkey.substring(2)];
                    }
                }
            } catch (e) {
                console.error(`[jump] params属性の解析に失敗しました:`, e);
            }
        }
        
        // 3. SystemSceneに遷移をリクエスト
        // ★★★ 正しいキーの取得方法 ★★★
        const fromSceneKey = manager.scene.scene.key; 
        manager.scene.scene.get('SystemScene').events.emit('request-scene-transition', {
            to: params.storage,
            from: fromSceneKey,
           params: transitionParams, // ★ ここはBattleSceneのinitで受け取れるようにキーを調整
            
            // ★★★ BGM制御情報を追加 ★★★
            bgm: {
                shouldFadeOut: params.fadeout_bgm === 'true'
            }
        });


        // 4. ★★★ 最重要：シナリオループを完全に停止させる ★★★
        manager.stop();
        
        // ★★★ pause()は絶対に呼び出さない！ ★★★

    // --- ファイル内ジャンプの場合 ---
    } else if (params.target && params.target.startsWith('*')) {
        console.log(`[jump] ラベル[${params.target}]へジャンプします。`);
        manager.jumpTo(params.target);
        
    } else {
        console.warn('[jump] 有効なstorage属性またはtarget属性が指定されていません。');
    }
    
    // ★★★ Promiseを返さない ★★★
    // manager.stop()が呼ばれるので、ループはここで終了する
}
