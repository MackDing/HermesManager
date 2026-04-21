package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/hermesmanager/hermesmanager/internal/api"
	"github.com/hermesmanager/hermesmanager/internal/policy"
	"github.com/hermesmanager/hermesmanager/internal/runtime"
	"github.com/hermesmanager/hermesmanager/internal/scheduler"
	"github.com/hermesmanager/hermesmanager/internal/storage/postgres"

	// Register runtime drivers via init()
	_ "github.com/hermesmanager/hermesmanager/internal/runtime/docker"
	_ "github.com/hermesmanager/hermesmanager/internal/runtime/k8s"
	_ "github.com/hermesmanager/hermesmanager/internal/runtime/local"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	port := envOr("HERMESMANAGER_PORT", "8080")
	dbURL := envOr("DATABASE_URL", "")
	policyFile := envOr("HERMESMANAGER_POLICY_FILE", "")

	// --- Store ---
	var handler http.Handler
	if dbURL != "" {
		store, err := postgres.New(ctx, dbURL)
		if err != nil {
			log.Fatalf("postgres: %v", err)
		}
		defer store.Close()

		if err := store.Migrate(ctx); err != nil {
			log.Fatalf("migrate: %v", err)
		}
		fmt.Println("postgres connected, migrations applied")

		// --- Policy engine ---
		var pol *policy.Engine
		if policyFile != "" {
			pol, err = policy.NewEngine(policyFile)
			if err != nil {
				log.Fatalf("policy: %v", err)
			}
			fmt.Printf("policy loaded from %s\n", policyFile)
		}

		// --- Runtimes ---
		runtimes, err := runtime.Build()
		if err != nil {
			log.Fatalf("runtimes: %v", err)
		}
		fmt.Printf("runtimes registered: %d\n", len(runtimes))

		// --- Scheduler ---
		sched := scheduler.NewScheduler(runtimes, store)

		// --- API server with real handlers ---
		srv := api.NewServer(store, sched, pol)
		handler = srv.Handler()
	} else {
		fmt.Println("WARNING: DATABASE_URL not set, running with stub handlers (dev mode)")
		handler = api.NewRouter()
	}

	httpSrv := &http.Server{
		Addr:         ":" + port,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		fmt.Printf("hermesmanager listening on :%s\n", port)
		if err := httpSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	<-ctx.Done()
	fmt.Println("\nshutting down...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := httpSrv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("shutdown error: %v", err)
	}
	fmt.Println("stopped")
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
