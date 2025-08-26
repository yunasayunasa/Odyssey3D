/**
 * [chara_mod] タグの処理
 * 表示中のキャラクターの表情などをクロスフェードで変更する
 * @param {ScenarioManager} manager
 * @param {Object} params - { name, face, time }
 * @returns {Promise<void>}
 */
export function handleCharaMod(manager, params) {
    return new Promise(resolve => {
        const { name, face } = params;
        if (!name || !face) {
            console.warn('[chara_mod] name属性とface属性は必須です。');
            resolve();
            return;
        }

        const chara = manager.scene.characters[name];
        const def = manager.characterDefs[name];
        if (!chara || !def) {
            console.warn(`[chara_mod] 変更対象のキャラクター[${name}]が見つかりません。`);
            resolve();
            return;
        }

        const storage = def.face[face];
        if (!storage) {
            console.warn(`キャラクター[${name}]の表情[${face}]が見つかりません。`);
            resolve();
            return;
        }

        // ★★★ stateManagerに関する処理はすべて不要なので削除 ★★★

        const time = Number(params.time) || 200;

        // --- クロスフェード処理 ---

        // 1. 新しい画像を、古い画像と全く同じプロパティで上に重ねて作成
        const newChara = manager.scene.add.image(chara.x, chara.y, storage);
        newChara.setAlpha(0);
        newChara.setScale(chara.scaleX, chara.scaleY);
        newChara.setFlipX(chara.flipX); // flip状態も引き継ぐ
        newChara.setDepth(chara.depth); // depthも引き継ぐ
        manager.layers.character.add(newChara);

        // 2. 新しい画像をフェードイン
        manager.scene.tweens.add({
            targets: newChara,
            alpha: 1,
            duration: time,
            ease: 'Linear',
            onComplete: () => {
                // ★ 新しい方のアニメーションが終わったら完了とする
                resolve();
            }
        });

        // 3. 古い画像をフェードアウトして破棄
        manager.scene.tweens.add({
            targets: chara,
            alpha: 0,
            duration: time,
            ease: 'Linear',
            onComplete: () => {
                chara.destroy();
            }
        });

        // 4. 管理リストの参照を、新しいキャラクターオブジェクトに差し替える
        // これにより、セーブ時には新しいテクスチャキーが保存される
        manager.scene.characters[name] = newChara;
    });
}