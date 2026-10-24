# Macで確認するための仮のサーバー。ブラウザに古いファイルを覚えさせない
# 使い方：calendar-app フォルダで python3 scripts/dev-server.py
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


ThreadingHTTPServer(("localhost", 8001), partial(NoCacheHandler, directory=".")).serve_forever()
