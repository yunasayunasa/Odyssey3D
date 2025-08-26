export function handleEndif(manager, params) {
    // 現在のifブロックの状態をスタックから取り除く
    manager.ifStack.pop();
   // manager.next();
   return Promise.resolve();
}