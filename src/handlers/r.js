// src/handlers/r.js
/**
 * [r] タグ - 選択肢表示 (Render choices)
 * [link]で溜めた選択肢を画面に表示する。
 */
export function handleReturn(manager, params) {
    if (manager.scene.pendingChoices && manager.scene.pendingChoices.length > 0) {
        manager.scene.displayChoiceButtons();
    }
    // isWaitingClick や isWaitingChoice のフラグは立てない！
    // 待機は[s]タグに任せる
    return Promise.resolve();
}