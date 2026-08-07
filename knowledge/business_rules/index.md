# knowledge/business_rules

RAG corpus — business_rules. Retrieval is deterministic: structured lookup by key before any embedding
search. Populate incrementally; every entry carries provenance (source + version + verified date).

Each rule file's frontmatter `key` is the lookup key (e.g. `RBAC-01`); cross-links inside rule bodies
use `[[KEY]]`. Where a rule maps to an executable check, `gate_rule` names the corresponding entry in
`governance/validation/business-rules.js` (`RULES[].id`) — `null` means the rule isn't (yet) codified
as a gate check, only documented here for authoring/review reference.

## Index

| Key | Title | Gate rule |
|---|---|---|
| [RBAC-01](RBAC-01-least-privilege-cascade.md) | Least-privilege cascade — a Role's grants gate both visibility and action everywhere | `BR-PERMISSION-DENIAL-EXPLICIT` |
| [RBAC-02](RBAC-02-group-scope-non-transitive.md) | Group scope is non-transitive — parent group membership does not cascade to child groups | `BR-CASCADE-NOT-IMPLICIT` |
| [RBAC-03](RBAC-03-delete-protection-in-use.md) | In-use entities are delete-protected — Used Count > 0 must block delete or force reassignment | `BR-DELETE-GUARD-USED-COUNT` |
| [RBAC-04](RBAC-04-no-self-elevation.md) | No self-elevation — a UI-hidden control is not enforcement without a backend denial | `BR-UI-HIDDEN-NEEDS-BACKEND-403` |
| [RBAC-05](RBAC-05-concurrent-session-policy.md) | Concurrent session policy — deny/force-logout a second login when disallowed | `BR-CONCURRENT-SESSION-DENIAL` |
| [ALERT-01](ALERT-01-poller-window-feasibility.md) | Poller/window feasibility — an occurrence/flap alert can only fire when the math allows it | `BR-POLLER-WINDOW-MATH` |
| [ALERT-02](ALERT-02-renotification-idempotence.md) | Re-notification idempotence across severity transitions on multi-threshold policies | *(none yet)* |
| [DISCOVERY-01](DISCOVERY-01-distinguishable-credential-errors.md) | Credential/config discovery failures must be distinguishable, never a silent data gap | *(none yet)* |
| [DISCOVERY-02](DISCOVERY-02-ifspeed-zero-guard.md) | ifSpeed=0 guard — utilization must never compute to 100%/infinite | *(none yet)* |
| [LICENSE-01](LICENSE-01-hardware-bound-integrity.md) | Hardware-bound license integrity — invalidate gracefully, never corrupt config | *(none yet)* |
| [REPORT-01](REPORT-01-raw-aggregated-consistency.md) | Raw vs aggregated data-layer consistency across retention boundaries | *(none yet)* |
| [REPORT-02](REPORT-02-export-fidelity.md) | Export fidelity — tag values, ordering, and clean filenames | `BR-EXPORT-VALUE-FIDELITY` |
| [HA-01](HA-01-no-dual-primary.md) | HA bring-up must fail explicitly on bad preconditions — never dual-primary/dual-VIP | *(none yet)* |
| [UPGRADE-01](UPGRADE-01-policy-config-survival.md) | Upgrades must never wipe existing policy notifications/actions | *(none yet)* |
| [AGENT-01](AGENT-01-lifecycle-cleanup.md) | Agent lifecycle cleanup — UI uninstall and HA re-registration must not leak resources | *(none yet)* |
| [CLONE-01](CLONE-01-cloned-object-independence.md) | Cloned-object independence — editing a clone must never affect the original | `BR-CLONE-INDEPENDENCE` |

Rules without a `gate_rule` are documented invariants intended for manual/AI test-case authoring and
review (`analyst`/`testcase-generator` agents) rather than automatic case-shape enforcement — several
require live-system setup (upgrade matrix, HA bring-up, license expiry) that a static case-shape check
can't verify.
