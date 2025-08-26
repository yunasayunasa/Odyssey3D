; === オーバーレイ機能 総合テストシナリオ ===

; --- 1. 基本的な表示と変数操作 ---
[eval exp="sf.overlay_count = (sf.overlay_count || 0) + 1"]
[chara_show name="yuna" pos="center" time=500]
[wait time=500]

yuna:「アクションシーンの上に、私が表示されていますか？」
yuna:「背後ではPLAYERの文字が動き続けているはずです。」

; --- 2. オーバーレイ上での演出 ---
yuna:「では、こちらのレイヤーだけで演出を行いますね。」

yuna:「まず、右へ移動。」
[move name="yuna" x=1000 alpha=1 time=1000] 
yuna:「次に、左へ移動。」
[move name="yuna" x=200 alpha=1 time=1000] 
[shake name="yuna" time=500]
yuna:「カメラのシェイクも、このオーバーレイシーンだけに影響します。」

; --- 3. グローバル変数(f変数)との連携 ---
yuna:「下のシーンが持つべきゲーム内変数も、ここから変更できますよ。」
[eval exp="f.score = (f.score || 0) + 100"]
yuna:「スコアに100ポイント加算しました。[s]」

; --- 4. 選択肢のテスト ---


*common_route
yuna:「これでテストは完了です。確認できたら、この会話を終了します。」
[chara_hide name="yuna" time=500]
[wait time=500]

; ★ 最後に必ずoverlay_endを呼んでシーンを閉じる
[overlay_end]