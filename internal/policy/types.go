// Package policy implements a hand-rolled YAML policy evaluator for HermesManager v0.1.
//
// Rules are deny/allow predicates over structured fields (model, user, team, tool, cost).
// A request is denied if ANY deny rule matches. If no deny rule matches, the request is allowed.
package policy

// Rule is a single policy rule loaded from YAML.
type Rule struct {
	ID         string            `yaml:"id"`
	Action     string            `yaml:"action"` // "deny" or "allow"
	Conditions map[string]string `yaml:"conditions"`
}

// PolicyRequest carries the fields a rule can match against.
type PolicyRequest struct {
	Model   string
	User    string
	Team    string
	Tool    string
	CostUSD float64
}

// PolicyFile is the top-level YAML structure for the policy file.
type PolicyFile struct {
	Rules []Rule `yaml:"rules"`
}
