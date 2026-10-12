## Illustrative workflow example

This is a conceptual walkthrough for the sample request, not a transcript of a completed session. The design choices below are assumptions to explore with the user.

![Codex Design workflow — concept illustration](https://geeduzbsatvodnlijqfs.supabase.co/storage/v1/object/public/product-media/69836a39-4ab4-4ed9-ac59-31de87ddc660/screenshots/1791732539120-wpyy.png)

### Clarify the product decisions

Start by exploring when a conflict needs a person to intervene, what information helps them choose a version, and how cancellation or recovery should work. Ask only the questions that change the design.

### Define the prototype scope

| Area | Example design direction to explore |
| --- | --- |
| Desktop | Compare competing versions with enough space to inspect changes. |
| Mobile | Present a focused choice with a clear consequence and a way to recover. |
| Shared mock state | Keep the same task and conflict identity across the simulated views. |
| Scenarios | Explore offline edits, concurrent changes, delayed responses, cancellation, and recovery. |

### Explore and refine

Build the related host simulations inside one Web project using mock data. Review the prototype in the browser, refine it through user feedback, and compare key states, layout, hierarchy, and interaction behavior.

### Capture the implementation basis

Record the confirmed scope, object relationships, state rules, visual decisions, remaining assumptions, and the prototype version they belong to. Begin production translation when the user requests it for that confirmed scope.

This example does not demonstrate a real sync service or native application. It illustrates the design process the skill guides.
