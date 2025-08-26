// src/handlers/p.js
/**
 * [p] タグ - 改ページ (Page Break)
 * クリック待ち状態に入る。
 */
export function handlePageBreak(manager, params) {
    // クリック待ち状態に入る
    manager.isWaitingClick = true;
    manager.messageWindow.showNextArrow();
if (manager.mode === 'auto') {
        manager.startAutoMode();
    }
    // 自身は即座に完了
    return Promise.resolve();
}
