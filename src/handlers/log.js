/**
 * [log] タグの処理
 * 指定した変数の値をコンソールに出力する。デバッグ用。
 * @param {ScenarioManager} manager
 * @param {Object} params - { exp }
 */
export function handleLog(manager, params) {
    const exp = params.exp;
    if (!exp) {
        console.warn('[log] exp属性は必須です。');
        return; // 何もせず同期的に完了
    }

    try {
        // StateManagerに式の「評価」だけを依頼し、結果を受け取る
        const value = manager.stateManager.eval(exp);
        
        // 評価した式と、その結果をコンソールに出力する
        console.log(`[Log Tag] ${exp}:`, value);
        
    } catch (e) {
        console.error(`[log] 式の評価中にエラーが発生しました: "${exp}"`, e);
    }

    // ★★★ このタグの処理は一瞬で終わるので、何も呼び出す必要はない ★★★
    // ScenarioManagerのメインループが、この関数の終了後に次の行の処理に進む
}