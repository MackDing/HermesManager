package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

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
	// Configure zerolog
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnixMs
	level, err := zerolog.ParseLevel(envOr("LOG_LEVEL", "info"))
	if err != nil {
		level = zerolog.InfoLevel
	}
	zerolog.SetGlobalLevel(level)
	log.Logger = zerolog.New(os.Stdout).With().Timestamp().Logger()

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
			log.Fatal().Err(err).Msg("postgres connection failed")
		}
		defer store.Close()

		if err := store.Migrate(ctx); err != nil {
			log.Fatal().Err(err).Msg("migration failed")
		}
		log.Info().Msg("postgres connected, migrations applied")

		// --- Policy engine ---
		var pol *policy.Engine
		if policyFile != "" {
			pol, err = policy.NewEngine(policyFile)
			if err != nil {
				log.Fatal().Err(err).Msg("policy load failed")
			}
			log.Info().Str("file", policyFile).Msg("policy loaded")
		}

		// --- Runtimes ---
		runtimes, err := runtime.Build()
		if err != nil {
			log.Fatal().Err(err).Msg("runtime build failed")
		}
		log.Info().Int("count", len(runtimes)).Msg("runtimes registered")

		// --- Scheduler ---
		sched := scheduler.NewScheduler(runtimes, store)

		// --- API server with real handlers ---
		srv := api.NewServer(store, sched, pol)
		handler = srv.Handler()
	} else {
		log.Warn().Msg("DATABASE_URL not set, running with stub handlers (dev mode)")
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
		log.Info().Str("port", port).Msg("hermesmanager listening")
		if err := httpSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("server error")
		}
	}()

	<-ctx.Done()
	log.Info().Msg("shutting down")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := httpSrv.Shutdown(shutdownCtx); err != nil {
		log.Fatal().Err(err).Msg("shutdown error")
	}
	log.Info().Msg("stopped")
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
