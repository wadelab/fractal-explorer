#!/usr/bin/env python3
"""
Development server for Fractal Explorer
Serves the build/dist directory with proper CORS headers for WASM
"""

import http.server
import socketserver
import os
import sys

PORT = 8000
DIRECTORY = "build/dist"

class WASMHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # CORS headers for WASM and SharedArrayBuffer support
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Access-Control-Allow-Origin', '*')

        # MIME types
        if self.path.endswith('.wasm'):
            self.send_header('Content-Type', 'application/wasm')
        elif self.path.endswith('.js'):
            self.send_header('Content-Type', 'application/javascript')
        elif self.path.endswith('.json'):
            self.send_header('Content-Type', 'application/json')

        super().end_headers()

    def log_message(self, format, *args):
        # Colored log output
        sys.stderr.write("\033[36m[%s]\033[0m %s\n" %
                         (self.log_date_time_string(),
                          format%args))

def main():
    # Check if build directory exists
    if not os.path.exists(DIRECTORY):
        print(f"\033[31m❌ Error: {DIRECTORY} does not exist\033[0m")
        print(f"\033[33m💡 Run 'make build' first to build the project\033[0m")
        sys.exit(1)

    # Check if index.html exists
    index_path = os.path.join(DIRECTORY, 'index.html')
    if not os.path.exists(index_path):
        print(f"\033[31m❌ Error: {index_path} does not exist\033[0m")
        print(f"\033[33m💡 Build may be incomplete\033[0m")
        sys.exit(1)

    print("\033[32m✓ Starting Fractal Explorer Development Server\033[0m")
    print(f"\033[36m📁 Serving: {os.path.abspath(DIRECTORY)}\033[0m")
    print(f"\033[36m🌐 URL: http://localhost:{PORT}\033[0m")
    print(f"\033[33m⚡ Press Ctrl+C to stop\033[0m")
    print()

    try:
        with socketserver.TCPServer(("", PORT), WASMHTTPRequestHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\033[32m✓ Server stopped\033[0m")
        sys.exit(0)

if __name__ == "__main__":
    main()
