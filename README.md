# 香港旅行 PWA

2026年11月7日〜10日の閲覧専用旅程アプリです。HTML・CSS・JavaScriptのみで動作します。

## ローカル確認

Service Workerの確認にはHTTPサーバーが必要です。

```sh
python3 -m http.server 8080
```

`http://localhost:8080/Desktop/hong-kong-trip/` を開きます。

## 旅程の更新

`trip-data.json` を編集します。Service Workerのキャッシュ名を更新する場合は、`sw.js` の `CACHE` を変更してください。

## GitHub Pages

このフォルダをリポジトリのルートとしてpushし、Settings → Pagesでブランチからの公開を有効にします。

## 参照した公式情報（2026年9月確認）

- 香港緊急通報: https://www.hkengage.gov.hk/en/essentials/basics/emergency-ambulance-services
- 在香港日本国総領事館: https://www.hk.emb-japan.go.jp/itpr_ja/opentime.html
- ディズニー・ハリウッド・ホテル: https://www.hongkongdisneyland.com/zh-hk/hotels/disneys-hollywood-hotel/
- HK Express運航状況: https://irop.hkexpress.com/en-us/flight-status/
