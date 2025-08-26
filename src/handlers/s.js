/**
 * [s] タグの処理
 * シナリオの進行を完全に停止する
 */
export function handleStop(manager, params) {
    console.log("シナリオ停止 [s]");
    manager.isEnd = true;
     return Promise.resolve();
    // このタグは next() を呼ばない。ここで全てが止まる。
}