---
name: ki-design-inspiration
ki-kind: process
ki-applicability: invocation-only
ki-depends-on: []
description: >
  Find website design inspiration in curated galleries and turn selected examples into practical directions
  for navigation, sections, calls to action, grids, motion, and other UI patterns. Use for visual references
  and adaptation ideas; website repository structure belongs to `ki-repo-website`.
argument-hint: 'help | inspire <website-or-component> | refresh'
---

# Website design inspiration

Turn a curated collection of design galleries into useful references for the current website or component. This is a research and design process, with no required governance dependencies or implementation stack.

Read [the source list](references/sources.md) when choosing galleries or refreshing the collection. It owns the URLs, routing notes, and review dates. Inclusion expresses interest in a gallery, not approval of every design it contains.

## Operating modes

### Mode HELP

For `help`, `-h`, or `?`, explain the source collection, inspiration output, and refresh operation, then stop. With a design request, infer INSPIRE. With no design context, explain the skill and ask what website or component needs inspiration.

### Mode INSPIRE

Use the current brief: page or component, audience, intended action, visual preferences, and any existing brand or technical constraints. Ask only for missing context that would materially change the search; an exploratory request can start with a stated assumption.

Choose the smallest useful set of galleries from the source list. A component request normally starts with its specialist gallery; a broader page request can start with Unsection or MotionSites. Expand when the first sources do not offer a useful fit, preserving any sources the user explicitly requested.

Inspect promising entries visually using the available browser or image tools, and follow the original website when interaction or responsive behaviour matters. A text extract can establish a gallery's subject but cannot establish a design's appearance. For motion, observe a recording or live interaction; a still image does not establish timing or behaviour. If access is limited, identify the unverified aspects and offer accessible references without inventing observations.

Return a short selection with a direct link to each inspected example, the observed design choice, why it fits the brief, and a concrete adaptation. Distinguish observation from proposed implementation. Assess the relevant tradeoffs: hierarchy and density for layouts, navigation and recovery for interactive components, and reduced motion and small-screen behaviour for animation. Gallery inclusion is not evidence of accessibility, conversion performance, or implementation quality.

Conclude with a coherent recommended direction that fits the site's content and identity. Extract reusable principles rather than copying a site's branding or assembling incompatible pieces. If implementation is also requested, pass the selected direction into that work under the current task's authority and toolchain.

For example:

- **“Give this documentation site's navbar more character.”** Start with Navbar Gallery; compare how selected examples balance identity with navigation density, then propose an adaptation that preserves the documentation hierarchy.
- **“Find motion references for a restrained product page.”** Start with 60fps and relevant MotionSites examples; explain the observed interaction, where it could support the content, and a reduced-motion alternative.
- **“Find an interesting 404 page for our shop.”** Start with 404s; connect the visual idea to a clear route back to products or search.

### Mode REFRESH

Refresh the canonical skill under `skills/design/ki-design-inspiration/` in `ki-agentic-harness`. From an installed copy, report suggested updates and route them to that source repository.

Follow the cadence in [the source list](references/sources.md), or refresh when a link fails, a gallery changes purpose, or the user asks to update the collection. Revisit each source, verify its current subject and access state, and reconcile its routing notes. Retain unavailable sources with an honest access note; update a URL only after establishing the destination's identity. Preserve user selections and distinguish proposed additions from accepted collection members. Record actual review dates and current limitations, then check the edited skill against `ki-skills`.
