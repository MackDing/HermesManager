// Package web serves the embedded React SPA from the Go binary.
package web

import (
	"embed"
	"io/fs"
	"net/http"
	"strings"
)

//go:embed dist/*
var distFS embed.FS

// Handler returns an http.Handler that serves the embedded SPA.
// Known API prefixes are passed through (not handled here).
// All other paths serve index.html for client-side routing.
func Handler() http.Handler {
	stripped, err := fs.Sub(distFS, "dist")
	if err != nil {
		panic("spa: failed to create sub filesystem: " + err.Error())
	}

	fileServer := http.FileServer(http.FS(stripped))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// API routes are NOT handled by the SPA
		if strings.HasPrefix(r.URL.Path, "/v1/") || r.URL.Path == "/healthz" {
			http.NotFound(w, r)
			return
		}

		// Try to serve the exact file (CSS, JS, images, etc.)
		path := r.URL.Path
		if path == "/" {
			path = "/index.html"
		}

		// Check if the file exists in the embedded FS
		f, err := stripped.Open(strings.TrimPrefix(path, "/"))
		if err == nil {
			f.Close()
			fileServer.ServeHTTP(w, r)
			return
		}

		// File not found — serve index.html for client-side routing (SPA fallback)
		r.URL.Path = "/"
		fileServer.ServeHTTP(w, r)
	})
}
