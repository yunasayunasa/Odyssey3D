/**
 * [return] タグの処理
 * callStackから戻り先の情報を取得し、シナリオの実行コンテキストを復元する
 * @param {ScenarioManager} manager
 * @param {Object} params - パラメータ（未使用）
 */
export async function handleReturn(manager, params) {
    if (manager.callStack.length === 0) {
        console.warn('[return] 呼び出し元(callStack)がありません。');
        // 戻る場所がないので、現在のシナリオを普通に次に進める
        return Promise.resolve();
    }
    
    // 1. callStackから戻り先の情報を取得
    const returnInfo = manager.callStack.pop();
    console.log("Return to:", returnInfo);

    const { file, line } = returnInfo;

    // 2. 戻り先のシナリオファイルをロード
    //    (既にキャッシュされているはずだが、念のためloadScenarioを使う)
    await manager.loadScenario(file);
    
    // 3. 戻り先の行番号にジャンプ
    manager.currentLine = line;
return Promise.resolve();
    // ★★★ この後、ScenarioManagerのメインループがnext()を呼び出す ★★★
    // これにより、[call]タグの次の行から処理が正しく再開される
}