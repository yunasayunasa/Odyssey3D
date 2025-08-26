/**
 * [elsif] タグの処理
 * @param {ScenarioManager} manager
 * @param {Object} params - { exp }
 * @returns {Promise<void>}
 */
export function handleElsif(manager, params) {
    if (manager.ifStack.length === 0) {
        console.error("[elsif] 対応する[if]が存在しません。");
        return Promise.resolve();
    }

    const ifState = manager.ifStack[manager.ifStack.length - 1];

    if (ifState.conditionMet) {
        ifState.skipping = true;
    } else {
        const exp = params.exp;
        if (!exp) {
            console.warn("[elsif] exp属性は必須です。");
            ifState.skipping = true;
            // ★ ここはOK
            return Promise.resolve();
        }

        if (manager.stateManager.eval(exp)) {
            ifState.skipping = false;
            ifState.conditionMet = true;
        } else {
            ifState.skipping = true;
        }
    }

    // ★★★ 修正箇所: 必ずPromiseを返す ★★★
    return Promise.resolve();
}