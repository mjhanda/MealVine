Build .claude/rules/security.md for this repository using security.md and the additional instructions. 

Start by inspecting the architecture.md. assume the repository is empty unless it has already been created and has files. 

First, read whatever esists and is relevant:
- architecture.md if present
- /Volumes/big2/Claude_bootstrap_template_files/General_Code_Quality_Prompts.md

Unless architecture.md clearly inidcates otherwise, assume this project is primarily a web and API application and prioritize:
- HTTP boundary security
- authentication and authorization
- input validation
- secret handling
- logging and error handling
- deployment and CI/CD safety

If the repo is early-stage:
- add a short "## Required Security Inputs" section
- add a clearly labeled "## Provisional Security Rules" section
- add a clearly labeled "## Prompt placeholders to resolve" section
- use onle safe, duable defaults gounded in known facts.


{if exists} In "## Prompt Placeholders To Resolve", include:

Use concrete stack mapping when possible. {provided examples if they are created}
- '{{HANDACODE_CODE_QUALITY_PROMPT}}' -> '/Volumes/big2/Claude_bootstrap_template_files/General_Code_Quality_Prompts.md'


If the architecutre identifies a specific stack, replace the plaeholder with the most relevant prompt files.
If the tack is still unknown, leave the placeholders unreasolved and mark them 'UNKNOWN' or 'TO BE DECIDED'

