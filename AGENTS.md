<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Token campaigns have no user accounts; each campaign is managed via a secret key (sha256-hashed in DB) checked in server functions — why: user chose public-form registration with no sign-in.
- Keep experience mode in the root provider, with browser persistence after hydration, and use shared topic-based Help/Field controls on content routes — why: mode and explanations must remain consistent across navigation without changing financial logic.
- Render the shared navigation and single main landmark in the root layout; content routes render unframed containers — why: every page needs the mode switch and exactly one primary landmark.
- Keep the guide's condition list driven by the shared CONDITIONS catalog, with explanations keyed by condition ID — why: the guide and creator must list the same rules.
- Share the token utility catalog, editor and validation schema across distribution campaigns and launchpad projects; launchpad utility is descriptive and never modifies the backer pool, yield or claims — why: coin planning must stay consistent without changing funding mechanics.
- Keep creation section contents mounted when collapsed — why: collapsing must preserve unsaved settings and simulator state.
- Spanish is a display-layer translation: src/lib/i18n-es.json (English text -> Spanish) applied to rendered text by a DOM translator started from the root provider; add new UI strings to that file — why: avoids rewriting every text() call site.
