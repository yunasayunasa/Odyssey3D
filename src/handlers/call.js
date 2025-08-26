/**
 * [call] タグの処理
 * サブルーチンとして別のシナリオやPhaserシーンを呼び出す。
 * 呼び出し元の情報はcallStackに積まれる。
 * @param {ScenarioManager} manager
 * @param {Object} params - { storage, target }
 */
export async function handleCall(manager, params) {
    const storage = params.storage;
    if (!storage) {
        console.warn('[call] storageは必須です。');
        return; // 何もせず同期的に完了
    }

    // ★★★ 戻り先の情報をコールスタックに積む ★★★
    // manager.currentLine は既に次の行を指しているので、-1 するのが一般的。
    // （ScenarioManagerの実装によるが、こうしておくと[call]の次の行に戻る）
    manager.callStack.push({
        file: manager.currentFile,
        line: manager.currentLine 
    });
    console.log("CallStack Pushed:", manager.callStack);

    if (storage.endsWith('.ks')) {
        // --- .ksファイル（サブルーチン）呼び出し ---
        console.log(`サブルーチン呼び出し: ${storage}`);
        // [jump] と同じように、シナリオをロードしてジャンプするだけ
        await manager.loadScenario(storage, params.target);
        // この後の next() は ScenarioManager のメインループに任せる
        
    } else {
        // --- 別のPhaserシーン呼び出し ---
        const sceneKey = storage;
        console.log(`Phaserシーン呼び出し: ${sceneKey}`);
         manager.scene.performSave(0); 
        // ★★★ SystemSceneを介した標準的なシーン遷移に任せる ★★★
        // jumpハンドラと全く同じロジックでOK
        manager.scene.scene.get('SystemScene').events.emit('request-scene-transition', {
            to: sceneKey,
            from: 'GameScene',
            // isCall: true のようなフラグを持たせても良い
            params: {
                // サブシーンに渡したいパラメータがあればここに入れる
            }
        });
        
        // シーン遷移が始まるので、この後のScenarioManagerのループは止める必要がある
        // そのため、ここでは何もせず、Promiseも解決しないでおく。
        // returnで復帰した際に、SystemSceneがGameSceneを再開させ、next()を呼んでくれる。
    }
}