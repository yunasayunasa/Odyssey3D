// handlers/eval.js (正しい最終版)

/**
 * [eval] タグの処理
 * JavaScriptの式を、ゲーム内変数のスコープで実行する。
 * @param {ScenarioManager} manager
 * @param {Object} params - { exp }
 * @returns {Promise<void>}
 */
export function handleEval(manager, params) {
    const exp = params.exp;
    if (!exp) {
        console.warn('[eval] exp属性は必須です。');
        return Promise.resolve();
    }

    try {
        // StateManagerのevalがPromiseを返さないのでawaitは不要
        manager.stateManager.eval(exp); 
    } catch (e) {
        // StateManagerのeval内でエラーが捕捉されなかった場合に備える
        console.error(`[eval] 式の実行中に予期せぬエラーが発生しました: "${exp}"`, e);
    }
    
    // 同期ハンドラなので、Promiseを返す
    return Promise.resolve();
}