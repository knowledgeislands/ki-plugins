# Tool shared-code standard and estate matrix

## Scope

This standard governs optional skill-owned installer and release-packaging projections for repositories that declare `ki-repo-tools`. It does not execute an installer, create a release, sign an artifact, publish a package, or migrate a receiver. The inventory records the 2026-09-24 state of all five declared `tools-*` repositories.

## Estate inventory

| Repository | Installer | Release packaging | Classification |
| ---------- | --------- | ----------------- | -------------- |
| `tools-git-almanac` | SHA-256 archive | No local packager | Archive candidate |
| `tools-ki` | Signed archive and rollback | Archive packager | Strong signed candidate |
| `tools-mgit` | Raw versioned source | None | Source migration candidate |
| `tools-rig` | Raw versioned source | None | Source migration candidate |
| `tools-techne` | Local link only | Archive packager and test | Not release-ready |

All five `install.sh` files are byte-distinct. The two `release/package.sh` files share the archive-plus-manual concept but remain byte-distinct. Version modules and installer tests are language-specific and stay repository-owned. Current raw-source installers do not verify downloaded bytes; the managed source profile therefore requires release checksums rather than canonising that weaker behaviour.

## Managed delivery profile contract

The supported profiles are:

- `source-script-v1` — a versioned executable and manual published as separate release assets with `SHA256SUMS`.
- `archive-sha256-v1` — an executable and manual in one exact-shape archive with `SHA256SUMS`.
- `signed-archive-v1` — the archive profile plus an Ed25519 signature over `SHA256SUMS` and an embedded receiver-owned public key.

A receiver selects one profile beneath `[skills.ki-repo-tools]` and supplies `tool`, `repository`, `env_prefix`, and `manual_path`. The signed profile also supplies `public_key_path`. Values are data; installer control flow remains in skill-owned templates.

The skill-owned `assets/shared-code/manifest.json` maps each template to one contained destination and records its SHA-256 digest. Rendering replaces only named tokens, records the template digest in the generated file, rejects unresolved tokens, and computes the expected digest of the complete rendered file. Local edits inside a managed file are drift, not an extension mechanism.

AUDIT distinguishes missing, exact, modified, non-executable, unsafe, obsolete, and repository-owned extension files. CONFORM may create only missing files and request their executable bits when every parameter and receiver-owned seam is valid, parent directories already exist, all present managed files agree exactly, and no obsolete managed projection remains. It never overwrites modified bytes, creates release directories, removes files, changes signing keys, or selects a profile. Repeating CONFORM after successful projection produces no writes or commands.

## Security and receiver-owned seams

HTTPS-only release downloads, exact version syntax, bounded redirects, checksums, archive member validation, and fail-closed signature verification are profile controls. The signing private key, signing operation, CI release workflow, public-key rotation decision, Homebrew update, source implementation, manual content, and executable build remain receiver-owned.

The source profile deliberately improves the current raw-download installers by requiring checksums. A receiver must publish the expected checksum assets before adopting it. The signed profile never falls back to checksum-only verification when OpenSSL or its public key is unavailable.

## Migration matrix

| Repository | Proposed profile | Receiver condition |
| ---------- | ---------------- | ------------------ |
| `tools-git-almanac` | `archive-sha256-v1` | Align archive naming and add canonical packager |
| `tools-ki` | `signed-archive-v1` | Reconcile rollback and receipt extensions around managed core |
| `tools-mgit` | `source-script-v1` | Publish checksums before adoption |
| `tools-rig` | `source-script-v1` | Publish checksums and retain Rig-specific path policy outside core |
| `tools-techne` | None yet | Complete release contract before selecting archive profile |

No receiver migration is automatic or required to accept this Harness contract. Create a receiver-local roadmap record only when that repository chooses profile adoption; do not create five speculative migrations from inventory alone.
